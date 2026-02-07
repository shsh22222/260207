# Parallel World Flow

GitHub Pages で確認する手順:

1. このリポジトリを GitHub に push します。
2. GitHub の **Settings → Pages** を開きます。
3. **Build and deployment** で `Deploy from a branch` を選び、
   ブランチは `main`（または `work`）、フォルダは `/ (root)` を指定します。
4. 保存すると数分後に表示用の URL が発行されます。

ローカルでの確認:

```bash
python -m http.server 8000
```

ブラウザで `http://localhost:8000` を開いてください。
