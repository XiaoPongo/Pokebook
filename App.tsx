import React, { useState, useEffect, useRef } from 'react';
import { Search, Star, Shuffle, X, ChevronRight, Home, Filter } from 'lucide-react';

interface Pokemon {
  id: number;
  name: string;
  types: Array<{
    type: {
      name: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
    };
  }>;
  height: number;
  weight: number;
  species: {
    url: string;
  };
}

interface PokemonSpecies {
  flavor_text_entries: Array<{
    flavor_text: string;
    language: {
      name: string;
    };
  }>;
  evolution_chain: {
    url: string;
  };
  habitat: {
    name: string;
  } | null;
  generation: {
    name: string;
  };
}

interface EvolutionChain {
  species: {
    name: string;
    url: string;
  };
  evolves_to: EvolutionChain[];
}

const typeColors: Record<string, string> = {
  normal: 'bg-gray-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  electric: 'bg-yellow-400',
  grass: 'bg-green-500',
  ice: 'bg-blue-300',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-600',
  flying: 'bg-indigo-400',
  psychic: 'bg-pink-500',
  bug: 'bg-green-400',
  rock: 'bg-yellow-800',
  ghost: 'bg-purple-700',
  dragon: 'bg-indigo-700',
  dark: 'bg-gray-800',
  steel: 'bg-gray-500',
  fairy: 'bg-pink-300',
};

const generations = [
  { value: '', label: 'All Generations' },
  { value: '1', label: 'Generation I (Kanto)' },
  { value: '2', label: 'Generation II (Johto)' },
  { value: '3', label: 'Generation III (Hoenn)' },
  { value: '4', label: 'Generation IV (Sinnoh)' },
  { value: '5', label: 'Generation V (Unova)' },
  { value: '6', label: 'Generation VI (Kalos)' },
  { value: '7', label: 'Generation VII (Alola)' },
  { value: '8', label: 'Generation VIII (Galar)' },
  { value: '9', label: 'Generation IX (Paldea)' },
];

const types = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

function App() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [pokemonSpecies, setPokemonSpecies] = useState<PokemonSpecies | null>(null);
  const [evolutionChain, setEvolutionChain] = useState<EvolutionChain | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1010');
        const data = await response.json();
        
        const pokemonPromises = data.results.map(async (pokemon: any) => {
          const pokemonResponse = await fetch(pokemon.url);
          return pokemonResponse.json();
        });

        const pokemonData = await Promise.all(pokemonPromises);
        setPokemonList(pokemonData);
        setFilteredPokemon(pokemonData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Pokemon:', error);
        setLoading(false);
      }
    };

    fetchPokemon();
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('pokemon-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    let filtered = pokemonList;

    if (searchTerm) {
      filtered = filtered.filter(pokemon =>
        pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pokemon.id.toString().includes(searchTerm)
      );
    }

    if (selectedType) {
      filtered = filtered.filter(pokemon =>
        pokemon.types.some(type => type.type.name === selectedType)
      );
    }

    if (selectedGeneration) {
      const genRanges: Record<string, [number, number]> = {
        '1': [1, 151],
        '2': [152, 251],
        '3': [252, 386],
        '4': [387, 493],
        '5': [494, 649],
        '6': [650, 721],
        '7': [722, 809],
        '8': [810, 905],
        '9': [906, 1010],
      };
      
      const range = genRanges[selectedGeneration];
      if (range) {
        filtered = filtered.filter(pokemon => 
          pokemon.id >= range[0] && pokemon.id <= range[1]
        );
      }
    }

    setFilteredPokemon(filtered);
  }, [pokemonList, searchTerm, selectedType, selectedGeneration]);

  const handlePokemonClick = async (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon);
    setShowDetails(true);
    
    try {
      const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`);
      const speciesData = await speciesResponse.json();
      setPokemonSpecies(speciesData);

      const evolutionResponse = await fetch(speciesData.evolution_chain.url);
      const evolutionData = await evolutionResponse.json();
      setEvolutionChain(evolutionData.chain);
    } catch (error) {
      console.error('Error fetching pokemon details:', error);
    }

    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const toggleFavorite = (pokemonId: number) => {
    const newFavorites = favorites.includes(pokemonId)
      ? favorites.filter(id => id !== pokemonId)
      : [...favorites, pokemonId];
    
    setFavorites(newFavorites);
    localStorage.setItem('pokemon-favorites', JSON.stringify(newFavorites));
  };

  const getRandomPokemon = () => {
    if (filteredPokemon.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredPokemon.length);
      handlePokemonClick(filteredPokemon[randomIndex]);
    }
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedPokemon(null);
    setPokemonSpecies(null);
    setEvolutionChain(null);
  };

  const getFlavorText = () => {
    if (!pokemonSpecies) return '';
    const englishEntry = pokemonSpecies.flavor_text_entries.find(
      entry => entry.language.name === 'en'
    );
    return englishEntry ? englishEntry.flavor_text.replace(/\f/g, ' ') : '';
  };

  const renderEvolutionChain = (chain: EvolutionChain): JSX.Element[] => {
    const evolutions: JSX.Element[] = [];
    let current = chain;

    while (current) {
      const pokemonId = current.species.url.split('/').slice(-2, -1)[0];
      evolutions.push(
        <div key={current.species.name} className="flex items-center">
          <div
            className="text-center cursor-pointer hover:transform hover:scale-105 transition-transform"
            onClick={() => {
              const pokemon = pokemonList.find(p => p.id === parseInt(pokemonId));
              if (pokemon) handlePokemonClick(pokemon);
            }}
          >
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`}
              alt={current.species.name}
              className="w-16 h-16 mx-auto mb-2"
            />
            <p className="text-sm font-medium capitalize">{current.species.name}</p>
          </div>
          {current.evolves_to.length > 0 && (
            <ChevronRight className="w-6 h-6 text-gray-400 mx-2" />
          )}
        </div>
      );
      current = current.evolves_to[0];
    }

    return evolutions;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading Pokédex...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-red-600 rounded-t-3xl p-6 shadow-lg border-4 border-red-800 relative">
          <div className="absolute top-4 left-6 w-12 h-12 bg-blue-400 rounded-full border-4 border-white shadow-inner"></div>
          <div className="absolute top-6 left-24 flex space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <h1 className="text-4xl font-bold text-white text-center">
            Pokédex
          </h1>
          <p className="text-red-100 text-center mt-2">Digital Encyclopedia</p>
        </div>

        {/* Main Content */}
        <div className="bg-gray-100 border-4 border-red-800 border-t-0 rounded-b-3xl overflow-hidden">
          {!showDetails ? (
            <div className="p-6">
              {/* Search and Filters */}
              <div className="bg-blue-900 rounded-2xl p-6 mb-6 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search Pokémon..."
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-blue-400 outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-blue-400 outline-none appearance-none"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      <option value="">All Types</option>
                      {types.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-blue-400 outline-none appearance-none"
                      value={selectedGeneration}
                      onChange={(e) => setSelectedGeneration(e.target.value)}
                    >
                      {generations.map(gen => (
                        <option key={gen.value} value={gen.value}>
                          {gen.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-center mt-4">
                  <button
                    onClick={getRandomPokemon}
                    className="bg-yellow-400 text-blue-900 font-bold py-3 px-6 rounded-full hover:bg-yellow-300 transition-colors flex items-center space-x-2 shadow-lg"
                  >
                    <Shuffle className="w-5 h-5" />
                    <span>Random Pokémon</span>
                  </button>
                </div>
              </div>

              {/* Pokemon Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPokemon.map(pokemon => (
                  <div
                    key={pokemon.id}
                    className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:transform hover:scale-105 border-2 border-gray-200 hover:border-blue-400"
                    onClick={() => handlePokemonClick(pokemon)}
                  >
                    <div className="relative">
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                        alt={pokemon.name}
                        className="w-24 h-24 mx-auto mb-3"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(pokemon.id);
                        }}
                        className="absolute top-0 right-0 p-1"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            favorites.includes(pokemon.id)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 hover:text-yellow-400'
                          } transition-colors`}
                        />
                      </button>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-500 font-medium">#{pokemon.id.toString().padStart(3, '0')}</p>
                      <h3 className="font-bold text-lg capitalize text-gray-800 mb-2">
                        {pokemon.name}
                      </h3>
                      
                      <div className="flex justify-center space-x-1 flex-wrap">
                        {pokemon.types.map(type => (
                          <span
                            key={type.type.name}
                            className={`px-3 py-1 rounded-full text-white text-xs font-medium ${typeColors[type.type.name]} mb-1`}
                          >
                            {type.type.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPokemon.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No Pokémon found matching your criteria.</p>
                </div>
              )}
            </div>
          ) : (
            /* Pokemon Details */
            <div ref={detailsRef} className="p-6">
              {selectedPokemon && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white relative">
                    <button
                      onClick={closeDetails}
                      className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center space-x-4">
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${selectedPokemon.id}.png`}
                        alt={selectedPokemon.name}
                        className="w-32 h-32"
                      />
                      <div>
                        <p className="text-blue-200 font-medium">#{selectedPokemon.id.toString().padStart(3, '0')}</p>
                        <h2 className="text-4xl font-bold capitalize mb-2">{selectedPokemon.name}</h2>
                        <div className="flex space-x-2">
                          {selectedPokemon.types.map(type => (
                            <span
                              key={type.type.name}
                              className={`px-4 py-2 rounded-full text-white font-medium ${typeColors[type.type.name]}`}
                            >
                              {type.type.name}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => toggleFavorite(selectedPokemon.id)}
                          className="mt-4 flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-full transition-colors"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              favorites.includes(selectedPokemon.id)
                                ? 'text-yellow-400 fill-current'
                                : 'text-white'
                            }`}
                          />
                          <span>{favorites.includes(selectedPokemon.id) ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Description */}
                    {pokemonSpecies && (
                      <div>
                        <h3 className="text-xl font-bold mb-3 text-gray-800">Description</h3>
                        <p className="text-gray-600 leading-relaxed">{getFlavorText()}</p>
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Physical</h4>
                        <p className="text-gray-600">Height: {selectedPokemon.height / 10} m</p>
                        <p className="text-gray-600">Weight: {selectedPokemon.weight / 10} kg</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Abilities</h4>
                        {selectedPokemon.abilities.map(ability => (
                          <p key={ability.ability.name} className="text-gray-600 capitalize">
                            {ability.ability.name.replace('-', ' ')}
                          </p>
                        ))}
                      </div>

                      {pokemonSpecies && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Habitat</h4>
                          <p className="text-gray-600 capitalize">
                            {pokemonSpecies.habitat?.name.replace('-', ' ') || 'Unknown'}
                          </p>
                          <p className="text-gray-600 capitalize">
                            {pokemonSpecies.generation.name.replace('-', ' ')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-gray-800">Base Stats</h3>
                      <div className="space-y-3">
                        {selectedPokemon.stats.map(stat => {
                          const statName = stat.stat.name.replace('-', ' ').replace('special', 'sp.');
                          const percentage = (stat.base_stat / 255) * 100;
                          
                          return (
                            <div key={stat.stat.name} className="flex items-center space-x-4">
                              <div className="w-24 text-sm font-medium text-gray-600 capitalize">
                                {statName}
                              </div>
                              <div className="w-12 text-right font-bold text-gray-800">
                                {stat.base_stat}
                              </div>
                              <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div
                                  className="bg-blue-500 h-3 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Evolution Chain */}
                    {evolutionChain && (
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Evolution Chain</h3>
                        <div className="flex justify-center items-center space-x-4 flex-wrap">
                          {renderEvolutionChain(evolutionChain)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white text-opacity-80">Team KADAK • Pokédex v2.0</p>
        </div>
      </div>
    </div>
  );
}

export default App;