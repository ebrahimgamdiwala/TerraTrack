import axios from 'axios';

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || '47eb522f37e64030bdcd12672b1c21bd';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

class NewsService {
  // Get environmental news
  async getEnvironmentalNews(params = {}) {
    try {
      const {
        country = '',
        pageSize = 10,
        page = 1,
        language = 'en'
      } = params;

      const queryParams = {
        apiKey: NEWS_API_KEY,
        q: 'environment OR climate OR sustainability OR "renewable energy" OR pollution OR conservation',
        sortBy: 'publishedAt',
        pageSize,
        page,
        language
      };

      if (country) {
        queryParams.country = country;
      }

      const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
        params: queryParams
      });

      return {
        success: true,
        articles: response.data.articles,
        totalResults: response.data.totalResults
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

  // Get top environmental headlines by country
  async getTopEnvironmentalHeadlines(country = 'us') {
    try {
      const response = await axios.get(`${NEWS_API_BASE_URL}/top-headlines`, {
        params: {
          apiKey: NEWS_API_KEY,
          category: 'science',
          country,
          pageSize: 10
        }
      });

      // Filter for environmental topics
      const environmentalArticles = response.data.articles.filter(article => {
        const text = `${article.title} ${article.description}`.toLowerCase();
        return text.includes('environment') || 
               text.includes('climate') || 
               text.includes('sustainability') ||
               text.includes('renewable') ||
               text.includes('pollution') ||
               text.includes('conservation');
      });

      return {
        success: true,
        articles: environmentalArticles,
        totalResults: environmentalArticles.length
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

  // Get news by location/region
  async getNewsByLocation(location, pageSize = 5) {
    try {
      const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
        params: {
          apiKey: NEWS_API_KEY,
          q: `environment OR climate in ${location}`,
          sortBy: 'publishedAt',
          pageSize,
          language: 'en'
        }
      });

      return {
        success: true,
        articles: response.data.articles,
        totalResults: response.data.totalResults
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
