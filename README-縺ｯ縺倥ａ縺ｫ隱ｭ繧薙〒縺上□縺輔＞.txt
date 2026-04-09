このフォルダは、ChatGPT の Actions で tax-law-mcp / hourei-mcp-server / labor-law-mcp を使うための橋渡し一式です。

【あなたがやること】
1. GitHub のアカウントを作る
2. 新しいリポジトリを1つ作る
3. このフォルダの中身をそのリポジトリにアップロードする
4. Vercel のアカウントを作る
5. Vercel でそのリポジトリを読み込んで Deploy する
6. 発行されたURLを openapi.yaml の先頭 servers.url に入れる
7. ChatGPT の GPT 作成画面 → Actions → Schema に openapi.yaml を貼る
8. Instructions に gpt-instructions.txt を貼る

【補足】
- 税法は既定で公開されている tax-law-mcp を参照します
- 本番運用では Vercel の Environment Variables に TAX_BASE_URL を設定し、自分の tax-law-mcp URL に変えるのが安全です
- hourei は XML を返します。これは元の hourei-mcp-server の仕様に合わせたものです
- labor の get-law は e-Gov API v2 を使って、条文テキストを返します
