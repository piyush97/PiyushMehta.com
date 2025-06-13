<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> RSS Feed</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1000px;
            margin: 0 auto;
            padding: 2rem 1rem;
            background-color: #f9f9f9;
          }
          a {
            color: #1a6ae4;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          header {
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #eee;
          }
          h1 {
            font-size: 2rem;
            font-weight: 700;
            margin: 0.5rem 0;
          }
          h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0.5rem 0;
          }
          .description {
            font-size: 1.1rem;
            color: #555;
            margin-top: 0.5rem;
          }
          .item {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          .date {
            color: #6b7280;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
          }
          .meta {
            display: flex;
            gap: 1rem;
            font-size: 0.9rem;
            color: #6b7280;
            margin-top: 1rem;
          }
          .tag {
            display: inline-block;
            background-color: #f3f4f6;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            margin-right: 0.5rem;
            font-size: 0.8rem;
          }
          footer {
            margin-top: 3rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
            color: #6b7280;
            font-size: 0.9rem;
          }
          .pagination {
            margin-top: 2rem;
            text-align: center;
          }
          .button {
            display: inline-block;
            padding: 0.5rem 1rem;
            background-color: #1a6ae4;
            color: white;
            border-radius: 4px;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .button:hover {
            background-color: #1356c0;
            text-decoration: none;
          }
          @media (max-width: 768px) {
            body {
              padding: 1rem;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <div class="description"><xsl:value-of select="/rss/channel/description"/></div>
          <p>
            <a href="{/rss/channel/link}" class="button">Visit Website</a>
          </p>
        </header>
        
        <main>
          <h2>Recent Articles</h2>
          <xsl:for-each select="/rss/channel/item">
            <div class="item">
              <h3>
                <a href="{link}"><xsl:value-of select="title"/></a>
              </h3>
              <div class="date">
                <time><xsl:value-of select="pubDate" /></time>
              </div>
              <div><xsl:value-of select="description"/></div>
              <div class="meta">
                <xsl:if test="author">
                  <div>Author: <xsl:value-of select="author"/></div>
                </xsl:if>
                <xsl:if test="category">
                  <div>
                    Tags: 
                    <xsl:for-each select="category">
                      <span class="tag"><xsl:value-of select="."/></span>
                    </xsl:for-each>
                  </div>
                </xsl:if>
              </div>
            </div>
          </xsl:for-each>
        </main>
        
        <footer>
          <p>This RSS feed was generated on <xsl:value-of select="/rss/channel/lastBuildDate"/></p>
          <p>Subscribe to this RSS feed by copying this URL: <code><xsl:value-of select="/rss/channel/link"/>/rss.xml</code></p>
        </footer>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
