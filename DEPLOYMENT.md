# Deployment

StockWatch is set up to deploy to GitHub Pages as a static site.

## Publish path

The repo publishes the built site to the `gh-pages` branch.

In your GitHub repository settings:

1. Open `Settings`.
2. Go to `Pages`.
3. Set the source to `Deploy from a branch`.
4. Choose `gh-pages` and `/ (root)`.

## Local deploy

Use the publish script to push a fresh build to `gh-pages`:

```bash
pnpm deploy:stockwatch
```

To build the GitHub Pages artifact locally without pushing it:

```bash
pnpm deploy:stockwatch:local
```

## Notes

- The app uses Vue Router history mode, so the `404.html` fallback is required for deep links like `/stock/AAPL`.
- If you ever convert this repo into a user or organization site, the Pages base path should be `/` instead of `/${repo-name}/`.
