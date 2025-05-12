# Space Dogfight Browser Game

## 1. Description
Jeu de combat spatial 1v1 / vs IA, browser-based, infiniment rejouable, compétitif, pilotage précis et intuitif.

## 2. Principales fonctionnalités
- **Modes** : 1v1, vs IA, free-for-all, capture de zone, survie.  
- **Pilotage** : commandes simples (clavier/souris), accélération, glisse, drift.  
- **Armes** : lasers, missiles à tête chercheuse, mines, canons à plasma, mods (vitesse, dégâts).  
- **Environnements** : astéroïdes, stations, nébuleuses—obstacles pour slalomer et se planquer.  
- **Replayabilité** : loot aléatoire, power-ups, cartes procédurales, objets bonus.

## 3. Systèmes de scoring & ranking
- Points pour kills, assists, objectifs.  
- Rang E → S+, ligues saisonnières, MMR visible.  
- Classements globaux et amis.

## 4. Boucle de jeu
1. Sélection de mode et vaisseau  
2. Briefing carte aléatoire  
3. Phase de combat (3–5 min)  
4. Fin de partie : score, rewards, tableau de classement  
5. Accès rapide à la revanche ou lobby

## 5. Contrôles
- **Déplacement** : ZQSD / WASD  
- **Visée** : souris  
- **Tir primaire / secondaire** : clic gauche / droit  
- **Boost / frein** : E / R  
- **Caméra libre** : molette

## 6. Architecture technique
- **Moteur** : Unreal Engine + Pixel Streaming (WebGL compatible)  
- **Multijoueur** : WebSockets (Node.js), serveurs dédiés  
- **UI** : HTML5/CSS, React pour menus  
- **Persistance** : MongoDB (profils, rangs, stats)

## 7. Design & UX
- HUD minimaliste (vies, munitions, radar)  
- Feedback visuel (traces de laser, explosions)  
- Sons immersifs (moteurs, tirs)

## 8. Roadmap
- Prototype UE + Pixel Streaming  
- MVP 1v1 local → en ligne  
- IA adaptive  
- Système de ligues + boutiques cosmétiques  
- Mobile / tablette (responsive)

## 9. Équipe & contributions
- Designers UX/UI  
- Dév UE C++/BluePrint  
- Dev back-end Node.js  
- QA & community manager

## 10. Licence
MIT © 2025
