const SUPABASE_URL = "https://dsokhfvtwidcuckqkdxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_aF11Da2IvCuJHohSL4OHsg_TQYcm8Jk";
const SITE_ROOT = "https://tr-reflexologie.com";

function buildXml(articles) {
  const urls = articles
    .filter((a) => a.slug)
    .map((a) => {
      const lastmod = (a.updated_at || a.published_at || "").slice(0, 10);
      return [
        "<url>",
        `<loc>${SITE_ROOT}/blog/${a.slug}</loc>`,
        lastmod ? `<lastmod>${lastmod}</lastmod>` : "",
        "<changefreq>monthly</changefreq>",
        "<priority>0.5</priority>",
        "</url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

module.exports = async (req, res) => {
  let articles = [];
  try {
    const url = `${SUPABASE_URL}/rest/v1/articles_blog?select=slug,updated_at,published_at&statut=eq.publie&order=published_at.desc`;
    const resp = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    articles = await resp.json();
  } catch (err) {
    console.error("sitemap-blog: erreur fetch Supabase", err);
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(buildXml(articles));
};
