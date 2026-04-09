これは Vercel Hobby の「12個までの関数数制限」に収まるように、hourei / labor のAPIを 2 本にまとめた版です。

入っているもの:
- api/hourei.js
- api/labor.js
- lib/common.js
- lib/labor-egov.js
- lib/labor-mhlw.js
- lib/labor-jaish.js
- openapi.yaml
- package.json
- vercel.json

使い方:
1. このフォルダの中身で、既存の legal-actions-bridge リポジトリを置き換える
2. Vercel で再デプロイする
3. openapi.yaml の YOUR-VERCEL-URL を実URLに置き換える
4. ChatGPT の My GPT に新しい Action として追加する
