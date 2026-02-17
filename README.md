# Abeille 3D interactive (Three.js)

## Fichiers
- `index.html` : structure one-page + UI texte.
- `styles.css` : style du fond, sections et overlay.
- `main.js` : scène Three.js, chargement GLB, scroll progress, animation.

## Où placer le modèle
Placez votre modèle **`bee.glb`** à la racine du projet, au même niveau que `index.html`.

```
interactive-3d/
├─ index.html
├─ styles.css
├─ main.js
└─ bee.glb   <-- ici
```

## Lancer le projet
Utilisez un petit serveur local (important pour charger le GLB en module ES).

### Option Python
```bash
python3 -m http.server 8000
```
Puis ouvrez `http://localhost:8000`.

### Option Node
```bash
npx serve .
```
Puis ouvrez l'URL affichée dans le terminal.
