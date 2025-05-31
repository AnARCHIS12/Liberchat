const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

console.log('Configuration Giphy :', {
  hasApiKey: !!GIPHY_API_KEY,
  keyLength: GIPHY_API_KEY?.length || 0
});

if (!GIPHY_API_KEY) {
  console.error('La clé API Giphy est manquante. Veuillez vérifier le fichier .env');
}

interface GiphyImage {
  url: string;
  width: string;
  height: string;
}

interface GiphyGif {
  id: string;
  images: {
    fixed_height_small: GiphyImage;
    original: GiphyImage;
  };
}

export const searchGifs = async (query: string, limit: number = 12, offset: number = 0): Promise<GiphyGif[]> => {
  try {
    console.log('Démarrage de la recherche Giphy avec:', {
      query,
      limit,
      offset,
      apiKeyLength: GIPHY_API_KEY?.length || 0
    });

    if (!query.trim()) {
      return [];
    }

    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY || '',
      q: query,
      limit: limit.toString(),
      offset: offset.toString(),
      rating: 'g',
      lang: 'fr'
    });

    console.log('Recherche Giphy avec paramètres:', {
      query: query,
      limit: limit,
      offset: offset,
      hasApiKey: !!GIPHY_API_KEY
    });

    const url = `https://api.giphy.com/v1/gifs/search?${params}`;
    console.log('URL de recherche (sans clé API):', url.replace(GIPHY_API_KEY || '', '[API_KEY]'));

    const response = await fetch(url);
    console.log('Statut de la réponse Giphy:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Réponse d\'erreur Giphy:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Erreur Giphy: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Réponse Giphy reçue:', {
      meta: data.meta,
      pagination: data.pagination,
      resultCount: data.data?.length || 0
    });
    
    if (!data.data || !Array.isArray(data.data)) {
      console.error('Format de réponse Giphy invalide:', data);
      throw new Error('Format de réponse Giphy invalide');
    }

    return data.data;
  } catch (error) {
    console.error('Erreur détaillée lors de la recherche Giphy:', {
      error,
      stack: (error as Error).stack,
      query,
      limit,
      offset
    });
    throw error;
  }
};

export const getTrendingGifs = async (limit: number = 12, offset: number = 0): Promise<GiphyGif[]> => {
  try {
    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY || '',
      limit: limit.toString(),
      offset: offset.toString(),
      rating: 'g'
    });

    const url = `https://api.giphy.com/v1/gifs/trending?${params}`;
    console.log('URL de recherche tendances (sans clé API):', url.replace(GIPHY_API_KEY || '', '[API_KEY]'));

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erreur Giphy: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Format de réponse Giphy invalide');
    }

    return data.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des GIFs tendance:', error);
    throw error;
  }
};
