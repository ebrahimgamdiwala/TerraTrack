import axios from 'axios';

// API Keys - Add your keys to .env file
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || '47eb522f37e64030bdcd12672b1c21bd';
const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY || ''; // Get free key from gnews.io
const NEWSDATA_API_KEY = import.meta.env.VITE_NEWSDATA_API_KEY || ''; // Get free key from newsdata.io
const CURRENTS_API_KEY = import.meta.env.VITE_CURRENTS_API_KEY || ''; // Get free key from currentsapi.services

// API Base URLs
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';
const GNEWS_API_BASE_URL = 'https://gnews.io/api/v4';
const NEWSDATA_API_BASE_URL = 'https://newsdata.io/api/1';
const CURRENTS_API_BASE_URL = 'https://api.currentsapi.services/v1';

// Indian news domains for NewsAPI
const INDIAN_NEWS_DOMAINS = [
  'timesofindia.indiatimes.com',
  'hindustantimes.com',
  'indianexpress.com',
  'ndtv.com',
  'thehindu.com',
  'livemint.com',
  'business-standard.com',
  'economictimes.indiatimes.com',
  'deccanherald.com',
  'telegraphindia.com',
  'news18.com',
  'firstpost.com',
  'moneycontrol.com',
  'scroll.in',
  'thequint.com',
  'downtoearth.org.in'
].join(',');

// Broad environmental keywords for loose filtering (more articles)
const ENVIRONMENTAL_KEYWORDS = [
  'climate', 'environment', 'pollution', 'carbon', 'emissions', 'energy',
  'solar', 'wind', 'sustainability', 'deforestation', 'biodiversity',
  'ecosystem', 'conservation', 'greenhouse', 'recycling', 'waste',
  'air quality', 'water', 'ocean', 'wildlife', 'endangered', 'net zero',
  'clean energy', 'plastic', 'drought', 'flood', 'wildfire', 'hurricane',
  'sea level', 'arctic', 'antarctic', 'ozone', 'forest', 'weather',
  'nature', 'earth', 'green', 'eco', 'renewable', 'environmental',
  'smog', 'AQI', 'monsoon', 'heatwave', 'cyclone', 'glacier'
];

class NewsService {
  // Soft filter - only checks if any environmental keyword exists (no exclusions)
  filterEnvironmentalArticles(articles) {
    if (!articles || !Array.isArray(articles)) return [];
    
    return articles.filter(article => {
      const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase();
      
      // Check if article contains at least one environmental keyword
      return ENVIRONMENTAL_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
    });
  }

  // Normalize articles from different APIs to a common format
  normalizeArticle(article, source) {
    switch (source) {
      case 'newsapi':
        return {
          title: article.title,
          description: article.description,
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: article.publishedAt,
          source: article.source?.name || 'News API',
          author: article.author
        };
      case 'gnews':
        return {
          title: article.title,
          description: article.description,
          url: article.url,
          urlToImage: article.image,
          publishedAt: article.publishedAt,
          source: article.source?.name || 'GNews',
          author: article.author
        };
      case 'newsdata':
        return {
          title: article.title,
          description: article.description,
          url: article.link,
          urlToImage: article.image_url,
          publishedAt: article.pubDate,
          source: article.source_id || 'NewsData',
          author: article.creator?.[0] || null
        };
      case 'currents':
        return {
          title: article.title,
          description: article.description,
          url: article.url,
          urlToImage: article.image !== 'None' ? article.image : null,
          publishedAt: article.published,
          source: article.author || 'Currents API',
          author: article.author
        };
      default:
        return article;
    }
  }

  // Fetch from NewsAPI.org
  async fetchFromNewsAPI(query, pageSize = 20, domains = '') {
    if (!NEWS_API_KEY) return [];
    
    try {
      const params = {
        apiKey: NEWS_API_KEY,
        q: query,
        sortBy: 'publishedAt',
        pageSize,
        language: 'en'
      };
      
      if (domains) {
        params.domains = domains;
      }
      
      const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, { params });
      return (response.data.articles || []).map(a => this.normalizeArticle(a, 'newsapi'));
    } catch (error) {
      console.warn('NewsAPI fetch failed:', error.message);
      return [];
    }
  }

  // Fetch Indian environmental news specifically from Indian domains
  async fetchIndianNewsFromNewsAPI(pageSize = 20) {
    if (!NEWS_API_KEY) return [];
    
    try {
      // India-specific environmental query
      const indiaQuery = 'climate OR pollution OR environment OR "air quality" OR smog OR Delhi OR Mumbai OR "renewable energy" OR monsoon OR flood OR drought OR wildlife OR forest';
      
      const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
        params: {
          apiKey: NEWS_API_KEY,
          q: indiaQuery,
          domains: INDIAN_NEWS_DOMAINS,
          sortBy: 'publishedAt',
          pageSize,
          language: 'en'
        }
      });
      return (response.data.articles || []).map(a => this.normalizeArticle(a, 'newsapi'));
    } catch (error) {
      console.warn('Indian NewsAPI fetch failed:', error.message);
      return [];
    }
  }

  // Fetch from GNews API (supports India region!)
  async fetchFromGNews(query, country = '', pageSize = 10) {
    if (!GNEWS_API_KEY) return [];
    
    try {
      const params = {
        apikey: GNEWS_API_KEY,
        q: query,
        lang: 'en',
        max: pageSize
      };
      
      if (country) {
        params.country = country; // 'in' for India, 'us' for US, etc.
      }
      
      const response = await axios.get(`${GNEWS_API_BASE_URL}/search`, { params });
      return (response.data.articles || []).map(a => this.normalizeArticle(a, 'gnews'));
    } catch (error) {
      console.warn('GNews fetch failed:', error.message);
      return [];
    }
  }

  // Fetch from NewsData.io (excellent India coverage!)
  async fetchFromNewsData(query, country = '', pageSize = 10) {
    if (!NEWSDATA_API_KEY) return [];
    
    try {
      const params = {
        apikey: NEWSDATA_API_KEY,
        q: query,
        language: 'en',
        size: pageSize
      };
      
      if (country) {
        params.country = country; // 'in' for India
      }
      
      const response = await axios.get(`${NEWSDATA_API_BASE_URL}/latest`, { params });
      return (response.data.results || []).map(a => this.normalizeArticle(a, 'newsdata'));
    } catch (error) {
      console.warn('NewsData fetch failed:', error.message);
      return [];
    }
  }

  // Fetch from Currents API
  async fetchFromCurrents(query, pageSize = 10) {
    if (!CURRENTS_API_KEY) return [];
    
    try {
      const response = await axios.get(`${CURRENTS_API_BASE_URL}/search`, {
        params: {
          apiKey: CURRENTS_API_KEY,
          keywords: query,
          language: 'en',
          limit: pageSize
        }
      });
      return (response.data.news || []).map(a => this.normalizeArticle(a, 'currents'));
    } catch (error) {
      console.warn('Currents API fetch failed:', error.message);
      return [];
    }
  }

  // Get environmental news from multiple sources - INDIA PRIORITY
  async getEnvironmentalNews(params = {}) {
    try {
      const {
        country = '',
        pageSize = 15,
        includeIndia = true,
        indiaPriority = 0.6 // 60% Indian news by default
      } = params;

      // Simpler, broader search query for more results
      const searchQuery = 'climate OR environment OR pollution OR "renewable energy" OR sustainability OR weather';
      
      // Calculate how many articles from each source
      const indiaCount = Math.ceil(pageSize * indiaPriority);
      const globalCount = pageSize - indiaCount;
      
      // Fetch from multiple sources in parallel - INDIA FIRST
      const promises = [
        // Primary: Indian news from NewsAPI using Indian domains
        this.fetchIndianNewsFromNewsAPI(40),
        // Secondary: Global news
        this.fetchFromNewsAPI(searchQuery, 20)
      ];

      // Add GNews for broader coverage
      if (GNEWS_API_KEY) {
        // India-specific from GNews
        promises.push(this.fetchFromGNews(searchQuery, 'in', 15));
        promises.push(this.fetchFromGNews(searchQuery, country || 'in', 10));
      }

      // Add NewsData for excellent India coverage
      if (NEWSDATA_API_KEY) {
        // India-specific from NewsData
        promises.push(this.fetchFromNewsData(searchQuery, 'in', 20));
        promises.push(this.fetchFromNewsData('India climate OR India pollution OR Delhi air OR Mumbai environment', '', 15));
      }

      // Add Currents API
      if (CURRENTS_API_KEY) {
        promises.push(this.fetchFromCurrents('India ' + searchQuery, 10));
      }

      const results = await Promise.allSettled(promises);
      
      // Combine all articles
      let allArticles = [];
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          allArticles = [...allArticles, ...result.value];
        }
      });

      // Light filtering - keep most environmental-related articles
      const filteredArticles = this.filterEnvironmentalArticles(allArticles);
      
      // Remove duplicates based on title similarity
      const uniqueArticles = this.removeDuplicates(filteredArticles);
      
      // Separate Indian and global articles
      const indianArticles = uniqueArticles.filter(a => this.isIndianSource(a));
      const globalArticles = uniqueArticles.filter(a => !this.isIndianSource(a));
      
      // Sort each by date
      indianArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      globalArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      
      // Interleave Indian and global news (prioritize Indian - 2:1 ratio)
      const finalArticles = [];
      let indiaIdx = 0, globalIdx = 0;
      
      while (finalArticles.length < pageSize && (indiaIdx < indianArticles.length || globalIdx < globalArticles.length)) {
        // Add 2 Indian articles
        if (indiaIdx < indianArticles.length) {
          finalArticles.push(indianArticles[indiaIdx++]);
        }
        if (indiaIdx < indianArticles.length && finalArticles.length < pageSize) {
          finalArticles.push(indianArticles[indiaIdx++]);
        }
        // Add 1 global article
        if (globalIdx < globalArticles.length && finalArticles.length < pageSize) {
          finalArticles.push(globalArticles[globalIdx++]);
        }
      }

      return {
        success: true,
        articles: finalArticles.slice(0, pageSize),
        totalResults: uniqueArticles.length,
        indianCount: indianArticles.length,
        globalCount: globalArticles.length
      };
    } catch (error) {
      console.error('Error fetching environmental news:', error);
      return {
        success: false,
        articles: [],
        totalResults: 0,
        error: error.message
      };
    }
  }

  // Check if article is from Indian source
  isIndianSource(article) {
    const indianIndicators = [
      'india', 'indian', 'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata',
      'hyderabad', 'pune', 'ahmedabad', 'times of india', 'hindustan times',
      'ndtv', 'indian express', 'the hindu', 'livemint', 'economic times',
      'deccan', 'telegraph india', 'news18', 'firstpost', 'moneycontrol',
      'scroll', 'quint', 'down to earth', 'zee news', 'aaj tak', 'republic',
      'abp', 'wion', 'ani', 'pti', 'ians'
    ];
    
    const text = `${article.title || ''} ${article.source || ''} ${article.url || ''}`.toLowerCase();
    return indianIndicators.some(indicator => text.includes(indicator));
  }

  // Remove duplicate articles
  removeDuplicates(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.title?.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Get top environmental headlines by country
  async getTopEnvironmentalHeadlines(country = 'us') {
    try {
      const promises = [];
      
      // NewsAPI headlines
      promises.push(
        axios.get(`${NEWS_API_BASE_URL}/top-headlines`, {
          params: {
            apiKey: NEWS_API_KEY,
            category: 'science',
            country,
            pageSize: 20
          }
        }).then(res => (res.data.articles || []).map(a => this.normalizeArticle(a, 'newsapi')))
        .catch(() => [])
      );

      // GNews top headlines
      if (GNEWS_API_KEY) {
        promises.push(
          axios.get(`${GNEWS_API_BASE_URL}/top-headlines`, {
            params: {
              apikey: GNEWS_API_KEY,
              category: 'science',
              country,
              max: 10
            }
          }).then(res => (res.data.articles || []).map(a => this.normalizeArticle(a, 'gnews')))
          .catch(() => [])
        );
      }

      const results = await Promise.all(promises);
      let allArticles = results.flat();

      // Light filtering
      const filteredArticles = this.filterEnvironmentalArticles(allArticles);
      const uniqueArticles = this.removeDuplicates(filteredArticles);

      return {
        success: true,
        articles: uniqueArticles.slice(0, 10),
        totalResults: uniqueArticles.length
      };
    } catch (error) {
      console.error('Error fetching top headlines:', error);
      return {
        success: false,
        articles: [],
        totalResults: 0,
        error: error.message
      };
    }
  }

  // Get India-specific environmental news
  async getIndiaEnvironmentalNews(pageSize = 10) {
    try {
      const query = 'India climate OR India environment OR India pollution OR India weather OR India renewable';
      
      const promises = [
        this.fetchFromNewsAPI(query, 20)
      ];

      if (GNEWS_API_KEY) {
        promises.push(this.fetchFromGNews('climate OR environment OR pollution', 'in', 15));
      }

      if (NEWSDATA_API_KEY) {
        promises.push(this.fetchFromNewsData('climate OR environment OR pollution', 'in', 15));
      }

      const results = await Promise.allSettled(promises);
      let allArticles = [];
      
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          allArticles = [...allArticles, ...result.value];
        }
      });

      const filteredArticles = this.filterEnvironmentalArticles(allArticles);
      const uniqueArticles = this.removeDuplicates(filteredArticles);
      uniqueArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      return {
        success: true,
        articles: uniqueArticles.slice(0, pageSize),
        totalResults: uniqueArticles.length
      };
    } catch (error) {
      console.error('Error fetching India news:', error);
      return {
        success: false,
        articles: [],
        totalResults: 0,
        error: error.message
      };
    }
  }

  // Get news by location/region
  async getNewsByLocation(location, pageSize = 5) {
    try {
      // Broader query for location
      const query = `${location} climate OR ${location} environment OR ${location} weather OR ${location} pollution`;
      
      const promises = [
        this.fetchFromNewsAPI(query, 15)
      ];

      if (GNEWS_API_KEY) {
        promises.push(this.fetchFromGNews(`${location} environment OR ${location} weather`, '', 10));
      }

      if (NEWSDATA_API_KEY) {
        promises.push(this.fetchFromNewsData(`${location}`, '', 10));
      }

      const results = await Promise.allSettled(promises);
      let allArticles = [];
      
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          allArticles = [...allArticles, ...result.value];
        }
      });

      const filteredArticles = this.filterEnvironmentalArticles(allArticles);

      return {
        success: true,
        articles: filteredArticles.slice(0, pageSize),
        totalResults: filteredArticles.length
      };
    } catch (error) {
      console.error('Error fetching location news:', error);
      return {
        success: false,
        articles: [],
        totalResults: 0,
        error: error.message
      };
    }
  }
}

export default new NewsService();
