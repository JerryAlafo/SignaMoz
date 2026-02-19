# 📋 Instruções Passo-a-Passo: Google Search Console + Bing Webmaster

## PARTE 1: Google Search Console ⭐ CRÍTICO

### Passo 1: Acessar Google Search Console

1. Abra: https://search.google.com/search-console
2. Se necessário, faça login com sua conta Google
3. Clique no botão azul **"Adicionar propriedade"**

### Passo 2: Selecionar tipo de propriedade

Você verá duas opções:

- **URL prefix** ← Escolha esta
- Domain

Escolha **URL prefix** e cole:

```
https://signa-moz.vercel.app
```

### Passo 3: Escolher método de verificação

Você verá várias opções:

```
[ ] Arquivo HTML
[ ] Metatag ← ESCOLHA ESTA (mais fácil)
[ ] Gravação DNS
[ ] Google Analytics
[ ] Google Tag Manager
```

Clique na aba **"Metatag"**

### Passo 4: Copiar o código

Você verá algo assim:

```html
<meta name="google-site-verification" content="abc123def456ghi789jk..." />
```

Copie **apenas o valor** dentro de `content="..."`:

```
abc123def456ghi789jk...
```

### Passo 5: Adicionar no código

1. Abra o arquivo: [app/layout.tsx](app/layout.tsx)
2. Procure por: `your-google-verification-code`
3. Substitua por seu código copiado

**Antes:**

```tsx
<meta name="google-site-verification" content="your-google-verification-code" />
```

**Depois:**

```tsx
<meta name="google-site-verification" content="abc123def456ghi789jk..." />
```

### Passo 6: Deploy

1. Salve o arquivo
2. No terminal na pasta do projeto:

```bash
git add -A
git commit -m "Add Google Search Console verification"
git push
```

3. O Vercel automaticamente faz deploy

### Passo 7: Verificar

1. Volta ao Google Search Console
2. Clique no botão **"Verificar"**
3. Se tudo deu certo, verá: ✅ "Propriedade verificada"

---

## PARTE 2: Bing Webmaster Tools 🔵 IMPORTANTE

### Passo 1: Acessar Bing Webmaster

1. Abra: https://www.bing.com/webmaster/
2. Se necessário, faça login com conta Microsoft
3. Clique em **"Adicionar site"**

### Passo 2: Digitar URL

Cole seu site:

```
https://signa-moz.vercel.app
```

Clique em **"Adicionar"**

### Passo 3: Escolher verificação por metatag

1. Você verá opções de verificação:

```
[ ] Arquivo XML
[ ] Metatag ← ESCOLHA ESTA
[ ] C-NAME record
```

2. Selecione **"Metatag"**

### Passo 4: Copiar código

Você verá:

```html
<meta name="msvalidate.01" content="abc123def456ghi789jk..." />
```

Copie **apenas o valor** de `content="..."`:

```
abc123def456ghi789jk...
```

### Passo 5: Adicionar no código

1. Abra: [app/layout.tsx](app/layout.tsx)
2. Procure por: `your-bing-verification-code`
3. Substitua pelo seu código

**Antes:**

```tsx
<meta name="msvalidate.01" content="your-bing-verification-code" />
```

**Depois:**

```tsx
<meta name="msvalidate.01" content="abc123def456ghi789jk..." />
```

### Passo 6: Deploy

```bash
git add -A
git commit -m "Add Bing Webmaster verification"
git push
```

### Passo 7: Verificar

1. Volta ao Bing Webmaster
2. Clique **"Verificar"** ou aguarde (até 24h)
3. Quando verificado: ✅

---

## PARTE 3: Submeter Sitemaps

### No Google Search Console:

1. Dashboard → **Sitemaps** (menu esquerdo)
2. Cole a URL do seu sitemap:

```
https://signa-moz.vercel.app/sitemap.xml
```

3. Clique **"Enviar"**
4. Você verá: ✅ "Sitemap enviado"

### No Bing Webmaster:

1. Dashboard → **Sitemaps** (menu esquerdo)
2. Clique **"Adicionar sitemap"**
3. Cole:

```
https://signa-moz.vercel.app/sitemap.xml
```

4. Clique **"Enviar"**

---

## PARTE 4: Verificação Rápida

### Confirme que tudo está funcionando:

#### Google:

```
Abra: https://search.google.com/test/mobile-friendly
Cole: https://signa-moz.vercel.app
```

#### Bing:

```
Abra: https://www.bing.com/webmaster/tools/
Clique: Ferramentas de depuração → Inspetor de URL
Cole: https://signa-moz.vercel.app
```

---

## Checklist Final

```
GOOGLE SEARCH CONSOLE:
[ ] Conta criada
[ ] Propriedade adicionada
[ ] Metatag copiada
[ ] Código adicionado em layout.tsx
[ ] Deploy realizado
[ ] Propriedade verificada
[ ] Sitemap enviado

BING WEBMASTER:
[ ] Conta criada
[ ] Site adicionado
[ ] Metatag copiada
[ ] Código adicionado em layout.tsx
[ ] Deploy realizado
[ ] Site verificado
[ ] Sitemap enviado

PRONTO PARA IR AO GOOGLE:
[ ] Todos os passos acima completos
[ ] Site acessível
[ ] Sitemap validado
```

---

## Tempo Esperado

| Ação                  | Tempo           |
| --------------------- | --------------- |
| Google Search Console | 15 minutos      |
| Bing Webmaster        | 15 minutos      |
| Deploy                | 2-5 minutos     |
| Verificação Google    | Imediato        |
| Verificação Bing      | até 24h         |
| **Total**             | **~35 minutos** |

---

## Dúvidas? Próximas Etapas

✅ Após completar este guia:

1. [Leia SEO_CHECKLIST.md](SEO_CHECKLIST.md) - Para compreender o que mais fazer
2. [Consulte SEO_TESTING.md](SEO_TESTING.md) - Para testar tudo
3. [Veja SEO_SUMMARY.md](SEO_SUMMARY.md) - Para resumo completo

---

## ⚠️ Erros Comuns

### Erro: "Metadados não encontrados"

✓ Verifique se o deploy foi realizado (Vercel)
✓ Aguarde 5 minutos
✓ Tente outra aba do navegador

### Erro: "Propriedade já existe"

✓ Você já adicionou este site
✓ Acesse seu dashboard e confirme verificação

### Erro: "URL não acessível"

✓ Vercel pode estar offline
✓ Verifique se https://signa-moz.vercel.app carrega
✓ Aguarde o deploy completar

---

**Status**: Pronto para começar  
**Próximo passo**: Abra Google Search Console  
**Tempo estimado**: 35 minutos para completar tudo

Você consegue! 🚀
