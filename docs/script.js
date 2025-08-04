document.addEventListener('DOMContentLoaded', () => {
    // Mise à jour automatique de l'année
    const yearElements = document.querySelectorAll('.current-year');
    const currentYear = new Date().getFullYear();
    yearElements.forEach(el => {
        el.textContent = currentYear;
    });

    // Animation pour les éléments au scroll
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .download-card, .about-content').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });

    // Navigation sticky avec effet de transparence
    const nav = document.querySelector('nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            nav.classList.remove('scroll-up');
            return;
        }
        
        if (currentScroll > lastScroll && !nav.classList.contains('scroll-down')) {
            nav.classList.remove('scroll-up');
            nav.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && nav.classList.contains('scroll-down')) {
            nav.classList.remove('scroll-down');
            nav.classList.add('scroll-up');
        }
        
        lastScroll = currentScroll;
    });

    // Effet de parallaxe sur le hero
    const hero = document.querySelector('.hero');
    window.addEventListener('scroll', () => {
        const scroll = window.pageYOffset;
        hero.style.backgroundPosition = `center ${scroll * 0.5}px`;
    });

    // Animation du logo au hover
    const logo = document.querySelector('.logo');
    logo.addEventListener('mouseenter', () => {
        logo.style.transform = 'scale(1.1)';
    });
    logo.addEventListener('mouseleave', () => {
        logo.style.transform = 'scale(1)';
    });

    // Easter egg anarchiste
    let clicks = 0;
    const easterEggColors = ['#ff2800', '#000000'];
    document.querySelector('.logo').addEventListener('click', () => {
        clicks++;
        if (clicks === 5) {
            document.documentElement.style.setProperty('--primary-color', easterEggColors[0]);
            document.documentElement.style.setProperty('--background-color', easterEggColors[1]);
            
            const fist = document.createElement('div');
            fist.innerHTML = '✊';
            fist.style.position = 'fixed';
            fist.style.fontSize = '100px';
            fist.style.left = '50%';
            fist.style.top = '50%';
            fist.style.transform = 'translate(-50%, -50%)';
            fist.style.animation = 'fistPump 1s infinite';
            document.body.appendChild(fist);
            
            setTimeout(() => {
                document.body.removeChild(fist);
            }, 3000);
        }
    });
});

// Styles pour l'animation du poing levé
const style = document.createElement('style');
style.textContent = `
    @keyframes fistPump {
        0% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.2); }
        100% { transform: translate(-50%, -50%) scale(1); }
    }
`;
document.head.appendChild(style);
