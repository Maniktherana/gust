# Deploying the Gust site to Vercel

`apps/site` is a TanStack Start application. TanStack Start owns the app and routing; Nitro is its deployment adapter. During a Vercel build, Nitro emits the Vercel Build Output API under `.vercel/output`.

## Vercel project settings

1. Import `Maniktherana/gust` into Vercel.
2. Set **Root Directory** to `apps/site`.
3. Select the **TanStack Start** framework preset if it is not detected automatically.
4. Leave **Build Command** at its framework default.
5. Clear **Output Directory** so the setting is completely blank. Do not set it to `dist`, `.output`, or `.vercel/output`.

The checked-in `apps/site/vercel.json` identifies the framework as TanStack Start. The Nitro configuration uses the Bun preset locally and the Vercel preset when Vercel sets its deployment environment. `.output` is the local Bun server bundle; it is not a Vercel output directory.
