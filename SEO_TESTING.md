# 🔍 Como Testar e Validar o SEO do Signa Moz

## Teste 1: Validar Metadados

### No navegador:

```javascript
// Cole no console do navegador (F12 → Console):
console.log(document.head.innerHTML);

// Procure por:
// - <title>
// - <meta name="description">
// - <meta name="keywords">
// - <meta property="og:title">
// - <meta property="og:image">
```

### Resultado esperado:

- Title: "Signa Moz - Tradução IA para Libras e Língua Gestual Moçambicana"
- Description: Deve conter "Signa Moz", "Tradução", "Libras"

## Teste 2: Validar Robots.txt

### Abra no navegador:

```
https://signa-moz.vercel.app/robots.txt
```

### Resultado esperado:

```
User-agent: *
Allow: /
Sitemap: https://signa-moz.vercel.app/sitemap.xml
```

## Teste 3: Validar Sitemap

### Abra no navegador:

```
https://signa-moz.vercel.app/sitemap.xml
```

### Resultado esperado:

- XML válido com pelo menos 2 URLs (/ e /contact)
- Cada URL deve ter: loc, lastmod, changefreq, priority

## Teste 4: Validar Structured Data

### Ferramenta oficial Google:

1. Acesse: https://schema.org/validator/
2. Cole a URL: https://signa-moz.vercel.app
3. Procure por: Organization, BreadcrumbList

### Ou use:

- Google Rich Snippets Tool: https://search.google.com/test/rich-results
- JSON-LD Validator: https://www.jsonschemavalidator.com/

## Teste 5: Validar Mobile

### Google Mobile-Friendly Test:

1. Acesse: https://search.google.com/test/mobile-friendly
2. Digite sua URL
3. Resultado esperado: "Pode ser acessado em dispositivos móveis"

## Teste 6: Performance

### Google PageSpeed Insights:

1. Acesse: https://pagespeed.web.dev
2. Digite sua URL
3. Meta: Score acima de 80 para Desktop e Mobile

### Reporte esperado:

- Performance
- Accessibility
- Best Practices
- SEO

## Teste 7: Validar HTTPS & Security

### No navegador:

- Clique no ícone de cadeado ao lado da URL
- Deve mostrar "Conexão segura"
- Certificado deve ser válido

## Teste 8: Open Graph Preview

### Para teste rápido:

1. Acesse: https://www.url-to-pdf.com/share-debugger
2. Ou: https://www.opengraph.xyz
3. Digite sua URL
4. Verifique título, descrição e imagem

## Teste 9: Indexação

### Verificar se está indexado:

```
site:signa-moz.vercel.app
```

Procure por isso no Google Search Bar e veja se aparece.

### Resultado esperado:

"Aproximadamente X resultados" (algum número > 0)

## Teste 10: Verificar Robots.txt Bloqueios

### Google Search Console:

1. Acesse GSC
2. Crawl → robots.txt Tester
3. Teste diferentes URLs
4. Resultado esperado: "Permitido" ✓

## Uma vez deployado, teste estes serviços:

### 1. Ubersuggest Audit (Free)

- Copie: https://app.ubersuggest.com/website-audit
- Insira seu URL
- Revise relatório de SEO

### 2. MailerLite's SEO Audit (Free)

- Copie: https://www.mailerlite.com/free-tools/seo-audit
- Insira seu URL
- Confira score

### 3. Keyword Checker

- Copie: https://tool.keyword.media/checker
- Procure por "Signa Moz"
- Verifique ranking

## Próximos Passos Após Deploy:

### Dia 1-7:

- [ ] Verificar em Search Console se foi indexado
- [ ] Verificar em Bing Webmaster
- [ ] Testar todos os testes acima

### Dia 8-30:

- [ ] Monitorar impressões em GSC
- [ ] Adicionar Google Analytics
- [ ] Começar a criar conteúdo (blog)

### Dia 31+:

- [ ] Analisar rankings
- [ ] Identificar oportunidades de keywords
- [ ] Criar stratégia de backlinks
- [ ] Otimizar com base em dados

## Checklist Técnico Pré-Deploy:

```
✅ Layout.tsx atualizado com metadados completos
✅ robots.txt criado
✅ sitemap.xml criado (estático)
✅ sitemap.ts criado (dinâmico)
✅ robots.ts criado
✅ next.config.ts otimizado
✅ manifest.json criado
✅ feed.xml criado
✅ Structured data adicionado
✅ Security headers configurados
✅ Canonical URL definido
✅ Lang attribute (pt-BR) configurado
✅ Viewport meta tag validado
✅ Charset UTF-8 definido
```

## Para Parecer em 1º Lugar:

### Velocidade (já está ✅):

- Vercel CDN
- Next.js optimization
- Image optimization
- Font optimization

### Relevância (sua responsabilidade):

- [ ] Conteúdo sobre "Signa Moz" (descrição clara do que é)
- [ ] Conteúdo sobre "Tradução Libras" (seu nicho)
- [ ] Conteúdo sobre "Língua Gestual Moçambicana" (seu diferencial)
- [ ] Perguntas frequentes (FAQ)

### Autoridade (seu foco):

- [ ] Backlinks de sites respeitáveis
- [ ] Menções em redes sociais
- [ ] Citações em blogs/jornais
- [ ] Parcerias com organizações relacionadas

**Resultado esperado**: Aparecer em 1º lugar para "Signa Moz" em 60-90 dias com essas otimizações + conteúdo + backlinks.
