let currentPage = 1;
let totalPages = 0;
let currentFilters = {
    status: 'all',
    gender: 'all'
};
let isLoading = false;
let episodesStorage = JSON.parse(localStorage.getItem('episodesStorage')) || [];

// Episodes variables
let currentEpisodesPage = 1;
let episodesTotalPages = 0;
let episodesPerPage = 8;
let allEpisodes = [];
let filteredEpisodes = [];
let currentSearchTerm = '';
let autocompleteTimeout;

// Locations variables
let currentLocationsPage = 1;
let locationsTotalPages = 0;
let locationsPerPage = 9;
let allLocations = [];
let filteredLocations = [];
let currentLocationSearch = '';
let currentLocationType = 'all';
let currentLocationDimension = 'all';

// Scroll variables
let lastScrollTop = 0;
let isScrolling = false;
let scrollTimeout;

// Initialize filters container on characters page
$(document).ready(function() {
    $('.characterspage .filters-container').html(`
        <div class="filter-group">
            <label for="statusFilter">Status:</label>
            <select id="statusFilter">
                <option value="all">All</option>
                <option value="alive">Alive</option>
                <option value="dead">Dead</option>
                <option value="unknown">Unknown</option>
            </select>
        </div>
        
        <div class="filter-group">
            <label for="genderFilter">Gender:</label>
            <select id="genderFilter">
                <option value="all">All</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="genderless">Genderless</option>
                <option value="unknown">Unknown</option>
            </select>
        </div>
        
        <button id="applyFilters" class="filter-btn">
            <i class="fas fa-filter"></i> Apply Filters
        </button>
        <button id="resetFilters" class="filter-btn reset">
            <i class="fas fa-times"></i> Reset
        </button>
    `);
    
    // Add back to top button
    $('body').append('<button class="back-to-top"><i class="fas fa-chevron-up"></i></button>');
    
    // Load all episodes on startup
    loadAllEpisodes();
    
    // Load all locations on startup
    loadAllLocations();
    
    // Add autocomplete styles
    addAutocompleteStyles();
    
    // Initial load
    loadInitialCharacters();
    updateActiveNavButton('homeBtn');
});

// Load all episodes for search
function loadAllEpisodes() {
    axios.get('https://rickandmortyapi.com/api/episode')
        .then((res) => {
            allEpisodes = res.data.results;
            filteredEpisodes = [...allEpisodes];
            episodesTotalPages = Math.ceil(filteredEpisodes.length / episodesPerPage);
        })
        .catch(error => {
            console.error('Error loading episodes:', error);
            showNotification('Error loading episodes', 'error');
        });
}

// Load all locations
function loadAllLocations() {
    axios.get('https://rickandmortyapi.com/api/location')
        .then((res) => {
            allLocations = res.data.results;
            filteredLocations = [...allLocations];
            locationsTotalPages = Math.ceil(filteredLocations.length / locationsPerPage);
        })
        .catch(error => {
            console.error('Error loading locations:', error);
            showNotification('Error loading locations', 'error');
        });
}

// Add autocomplete styles
function addAutocompleteStyles() {
    $('head').append(`
        <style>
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #2ecc71, #27ae60);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 10px;
                transform: translateX(150%);
                transition: transform 0.3s ease;
                z-index: 10000;
                max-width: 400px;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification i {
                font-size: 1.2rem;
            }
            
            @media (max-width: 768px) {
                .notification {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        </style>
    `);
}

// Initialize episodes page with search and filters
function initEpisodesPage() {
    // Clear existing search container
    $('.episodes-search-container').remove();
    
    // Add search container
    $('.episodespage .page-title').after(`
        <div class="episodes-search-container">
            <h3><i class="fas fa-search"></i> Search & Filter Episodes</h3>
            <div class="episodes-search-form">
                <div class="search-filter-row">
                    <div class="autocomplete-container" style="flex: 1;">
                        <input type="text" id="episodeSearchInput" placeholder="Type to search episodes...">
                        <div class="autocomplete-dropdown"></div>
                    </div>
                    <button id="episodeSearchBtn" class="episode-search-btn">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="seasonFilter"><i class="fas fa-filter"></i> Season:</label>
                        <select id="seasonFilter">
                            <option value="all">All Seasons</option>
                            <option value="S01">Season 1</option>
                            <option value="S02">Season 2</option>
                            <option value="S03">Season 3</option>
                            <option value="S04">Season 4</option>
                            <option value="S05">Season 5</option>
                            <option value="S06">Season 6</option>
                        </select>
                    </div>
                    <button id="clearEpisodeSearch" class="clear-search-btn">
                        <i class="fas fa-times"></i> Clear Search
                    </button>
                </div>
            </div>
        </div>
    `);
    
    // Set current search term in input if exists
    if (currentSearchTerm) {
        $('#episodeSearchInput').val(currentSearchTerm);
    }
}

// Initialize locations page with search and filters
function initLocationsPage() {
    // Clear existing search container
    $('.locations-search-container').remove();
    
    // Add search container
    $('.locationspage .page-subtitle').after(`
        <div class="locations-search-container">
            <h3><i class="fas fa-search"></i> Search & Filter Locations</h3>
            <div class="locations-search-form">
                <div class="location-search-row">
                    <input type="text" id="locationSearchInput" placeholder="Search by name or dimension...">
                    <button id="locationSearchBtn" class="location-search-btn">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
                <div class="location-filter-row">
                    <div class="filter-group">
                        <label for="locationTypeFilter"><i class="fas fa-filter"></i> Type:</label>
                        <select id="locationTypeFilter">
                            <option value="all">All Types</option>
                            <option value="Planet">Planet</option>
                            <option value="Cluster">Cluster</option>
                            <option value="Space station">Space Station</option>
                            <option value="Microverse">Microverse</option>
                            <option value="Fantasy town">Fantasy Town</option>
                            <option value="Dream">Dream</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="locationDimensionFilter"><i class="fas fa-globe"></i> Dimension:</label>
                        <select id="locationDimensionFilter">
                            <option value="all">All Dimensions</option>
                            <option value="Dimension C-137">Dimension C-137</option>
                            <option value="unknown">Unknown</option>
                            <option value="Post-Apocalyptic Dimension">Post-Apocalyptic</option>
                            <option value="Replacement Dimension">Replacement Dimension</option>
                            <option value="Cronenberg Dimension">Cronenberg Dimension</option>
                        </select>
                    </div>
                    <button id="clearLocationSearch" class="clear-location-search">
                        <i class="fas fa-times"></i> Clear Filters
                    </button>
                </div>
            </div>
        </div>
    `);
    
    // Set current values if they exist
    if (currentLocationSearch) {
        $('#locationSearchInput').val(currentLocationSearch);
    }
    if (currentLocationType) {
        $('#locationTypeFilter').val(currentLocationType);
    }
    if (currentLocationDimension) {
        $('#locationDimensionFilter').val(currentLocationDimension);
    }
}

// Handle scroll for navbar and back to top button
function handleScroll() {
    if (isScrolling) return;
    
    isScrolling = true;
    clearTimeout(scrollTimeout);
    
    const st = window.pageYOffset || document.documentElement.scrollTop;
    const btnContainer = $('.BtnContainer');
    const backToTop = $('.back-to-top');
    
    // Show/hide back to top button
    if (st > 300) {
        backToTop.addClass('visible');
    } else {
        backToTop.removeClass('visible');
    }
    
    // Handle navbar show/hide
    if (st > lastScrollTop && st > 100) {
        // Scrolling down
        btnContainer.addClass('hidden');
    } else {
        // Scrolling up
        btnContainer.removeClass('hidden');
    }
    
    lastScrollTop = st <= 0 ? 0 : st;
    
    scrollTimeout = setTimeout(() => {
        isScrolling = false;
    }, 100);
}

// Get characters with pagination and filters
function getCharacters(page, filters = currentFilters) {
    if (isLoading) return;
    
    isLoading = true;
    $('.characterContainer').html('<div class="loading"><i class="fas fa-spinner fa-spin"></i><h3>Loading characters...</h3></div>');
    
    let url = `https://rickandmortyapi.com/api/character?page=${page}`;
    
    if (filters.status && filters.status !== 'all') {
        url += `&status=${filters.status}`;
    }
    
    if (filters.gender && filters.gender !== 'all') {
        url += `&gender=${filters.gender}`;
    }
    
    axios.get(url)
    .then((res) => {
        totalPages = res.data.info.pages;
        
        if (res.data.results.length === 0) {
            $('.characterContainer').html(`
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No characters found</h3>
                    <p>Try changing filters</p>
                </div>
            `);
            $('.pagination').hide();
        } else {
            $('.pagination').show();
            
            for(let el of res.data.results){
                $('.characterContainer').append(`
                    <div class="characterItem">
                        <div class="characterImage">
                            <img src="${el.image}" alt="${el.name}">
                        </div>
                        <div class="characterInfo">
                            <p>${el.name}</p>
                            <p><strong>Status:</strong> ${el.status}</p>
                            <p><strong>Gender:</strong> ${el.gender}</p>
                            <p><strong>Species:</strong> ${el.species}</p>
                            <button class="viewBtn" id="${el.id}">View Details</button>
                        </div>
                    </div>
                `);
            }
        }
        
        createPagination();
        updateFilterIndicators();
        isLoading = false;
    })
    .catch((error) => {
        console.error('Loading error:', error);
        
        if (error.response && error.response.status === 404) {
            $('.characterContainer').html(`
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No characters found</h3>
                    <p>No results for selected filters</p>
                </div>
            `);
            $('.pagination').hide();
        } else {
            $('.characterContainer').html(`
                <div class="error">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Loading error</h3>
                    <p>Please try again</p>
                </div>
            `);
        }
        
        isLoading = false;
    });
}

// Create pagination controls for characters
function createPagination() {
    const container = $('.pages-container');
    container.empty();
    
    if (totalPages <= 1) {
        $('.pagination').hide();
        return;
    }
    
    $('.pagination').show();
    
    if (currentPage > 3) {
        container.append('<div class="page-number" data-page="1">1</div>');
        if (currentPage > 4) {
            container.append('<div class="page-number dots">...</div>');
        }
    }
    
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
        if (i === currentPage) {
            container.append(`<div class="page-number active">${i}</div>`);
        } else {
            container.append(`<div class="page-number" data-page="${i}">${i}</div>`);
        }
    }
    
    if (currentPage < totalPages - 2) {
        if (currentPage < totalPages - 3) {
            container.append('<div class="page-number dots">...</div>');
        }
        container.append(`<div class="page-number" data-page="${totalPages}">${totalPages}</div>`);
    }
    
    $('#prevPage').prop('disabled', currentPage === 1);
    $('#nextPage').prop('disabled', currentPage === totalPages);
}

// Update filter indicators
function updateFilterIndicators() {
    $('#statusFilter').val(currentFilters.status);
    $('#genderFilter').val(currentFilters.gender);
    
    let statusText = $('#statusFilter option:selected').text();
    let genderText = $('#genderFilter option:selected').text();
    
    if (currentFilters.status !== 'all' || currentFilters.gender !== 'all') {
        $('.active-filters').remove();
        $('.filters-container').append(`
            <div class="active-filters">
                <span>Active filters:</span>
                ${currentFilters.status !== 'all' ? `<span class="filter-tag">${statusText}</span>` : ''}
                ${currentFilters.gender !== 'all' ? `<span class="filter-tag">${genderText}</span>` : ''}
            </div>
        `);
    } else {
        $('.active-filters').remove();
    }
}

// Search and filter episodes
function searchAndFilterEpisodes() {
    const searchTerm = $('#episodeSearchInput').val().toLowerCase().trim();
    const season = $('#seasonFilter').val();
    
    currentSearchTerm = searchTerm;
    
    // Apply search filter
    if (searchTerm) {
        filteredEpisodes = allEpisodes.filter(ep => 
            ep.name.toLowerCase().includes(searchTerm) ||
            ep.episode.toLowerCase().includes(searchTerm) ||
            ep.air_date.toLowerCase().includes(searchTerm)
        );
    } else {
        filteredEpisodes = [...allEpisodes];
    }
    
    // Apply season filter
    if (season !== 'all') {
        filteredEpisodes = filteredEpisodes.filter(ep => ep.episode.startsWith(season));
    }
    
    currentEpisodesPage = 1;
    episodesTotalPages = Math.ceil(filteredEpisodes.length / episodesPerPage);
    loadEpisodes(1);
    
    // Show notification if search was performed
    if (searchTerm) {
        showNotification(`Found ${filteredEpisodes.length} episodes matching "${searchTerm}"`, 'info');
    }
}

// Clear episode search
function clearEpisodeSearch() {
    $('#episodeSearchInput').val('');
    $('#seasonFilter').val('all');
    currentSearchTerm = '';
    filteredEpisodes = [...allEpisodes];
    currentEpisodesPage = 1;
    episodesTotalPages = Math.ceil(filteredEpisodes.length / episodesPerPage);
    loadEpisodes(1);
    showNotification('Search cleared', 'info');
}

// Search and filter locations
function searchAndFilterLocations() {
    const searchTerm = $('#locationSearchInput').val().toLowerCase().trim();
    const type = $('#locationTypeFilter').val();
    const dimension = $('#locationDimensionFilter').val();
    
    currentLocationSearch = searchTerm;
    currentLocationType = type;
    currentLocationDimension = dimension;
    
    // Apply search filter
    if (searchTerm) {
        filteredLocations = allLocations.filter(loc => 
            loc.name.toLowerCase().includes(searchTerm) ||
            loc.dimension.toLowerCase().includes(searchTerm) ||
            loc.type.toLowerCase().includes(searchTerm)
        );
    } else {
        filteredLocations = [...allLocations];
    }
    
    // Apply type filter
    if (type !== 'all') {
        filteredLocations = filteredLocations.filter(loc => loc.type === type);
    }
    
    // Apply dimension filter
    if (dimension !== 'all') {
        filteredLocations = filteredLocations.filter(loc => loc.dimension === dimension);
    }
    
    currentLocationsPage = 1;
    locationsTotalPages = Math.ceil(filteredLocations.length / locationsPerPage);
    loadLocations(1);
    
    // Show notification if search was performed
    if (searchTerm || type !== 'all' || dimension !== 'all') {
        showNotification(`Found ${filteredLocations.length} locations`, 'info');
    }
}

// Clear location search
function clearLocationSearch() {
    $('#locationSearchInput').val('');
    $('#locationTypeFilter').val('all');
    $('#locationDimensionFilter').val('all');
    currentLocationSearch = '';
    currentLocationType = 'all';
    currentLocationDimension = 'all';
    filteredLocations = [...allLocations];
    currentLocationsPage = 1;
    locationsTotalPages = Math.ceil(filteredLocations.length / locationsPerPage);
    loadLocations(1);
    showNotification('Filters cleared', 'info');
}

// Load episodes with pagination
function loadEpisodes(page = 1) {
    $('.episodesContainer').html('<div class="episodesLoading"><i class="fas fa-spinner"></i><h3>Loading episodes...</h3></div>');
    
    if (allEpisodes.length === 0) {
        loadAllEpisodes();
        setTimeout(() => {
            displayEpisodes(page);
        }, 500);
    } else {
        displayEpisodes(page);
    }
}

// Display episodes for current page
function displayEpisodes(page) {
    currentEpisodesPage = page;
    $('.episodesContainer').empty();
    
    const start = (page - 1) * episodesPerPage;
    const end = start + episodesPerPage;
    const episodesToShow = filteredEpisodes.slice(start, end);
    
    if (episodesToShow.length === 0) {
        $('.episodesContainer').html(`
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No episodes found</h3>
                ${currentSearchTerm ? `<p>No results for "${currentSearchTerm}"</p>` : '<p>Try changing filters</p>'}
            </div>
        `);
    } else {
        for (let el of episodesToShow) {
            const season = el.episode.substring(0, 3);
            const isInWatchlist = episodesStorage.some(ep => ep.id == el.id);
            
            $('.episodesContainer').append(`
                <div class="episodeItem">
                    <div class="episodeHeader">
                        <div class="episodeCode">${el.episode}</div>
                        <div class="episodeSeason">${season}</div>
                    </div>
                    <div class="episodeName">${el.name}</div>
                    <div class="episodeDetails">
                        <div class="episodeDate">
                            <i class="far fa-calendar-alt"></i>
                            <span>${el.air_date}</span>
                        </div>
                        <div class="episodeCharacters">
                            ${el.characters.length} characters in this episode
                        </div>
                    </div>
                    <div class="episodeButtons">
                        <button class="ADDBtn ${isInWatchlist ? 'added' : ''}" data-id="${el.id}">
                            <i class="${isInWatchlist ? 'fas fa-check' : 'fas fa-plus'}"></i>
                            ${isInWatchlist ? 'Added to Watchlist' : 'Add to Watchlist'}
                        </button>
                    </div>
                </div>
            `);
        }
    }
    
    createEpisodesPagination();
}

// Load locations with pagination
function loadLocations(page = 1) {
    $('.locationsContainer').html('<div class="loading"><i class="fas fa-spinner fa-spin"></i><h3>Loading locations...</h3></div>');
    
    if (allLocations.length === 0) {
        loadAllLocations();
        setTimeout(() => {
            displayLocations(page);
        }, 500);
    } else {
        displayLocations(page);
    }
}

// Display locations for current page
function displayLocations(page) {
    currentLocationsPage = page;
    $('.locationsContainer').empty();
    
    const start = (page - 1) * locationsPerPage;
    const end = start + locationsPerPage;
    const locationsToShow = filteredLocations.slice(start, end);
    
    if (locationsToShow.length === 0) {
        $('.locationsContainer').html(`
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No locations found</h3>
                ${currentLocationSearch ? `<p>No results for "${currentLocationSearch}"</p>` : '<p>Try changing filters</p>'}
            </div>
        `);
    } else {
        for (let el of locationsToShow) {
            $('.locationsContainer').append(`
                <div class="locationItem">
                    <div class="locationHeader">
                        <div class="locationName">${el.name}</div>
                        <div class="locationType">${el.type}</div>
                    </div>
                    <div class="locationDetails">
                        <div class="dimension">
                            <i class="fas fa-globe"></i>
                            <span>${el.dimension}</span>
                        </div>
                        <div class="residentsCount">
                            <i class="fas fa-users"></i>
                            <span>${el.residents.length} residents</span>
                        </div>
                    </div>
                    <div class="locationButtons">
                        <button class="viewResidentsBtn" data-id="${el.id}">
                            <i class="fas fa-eye"></i>
                            View Residents
                        </button>
                    </div>
                </div>
            `);
        }
    }
    
    createLocationsPagination();
}

// Create episodes pagination
function createEpisodesPagination() {
    $('.episodesPagination').remove();
    
    if (episodesTotalPages <= 1) return;
    
    const pagination = $('<div class="episodesPagination"></div>');
    pagination.append('<button id="episodesPrev" ' + (currentEpisodesPage === 1 ? 'disabled' : '') + '>‹</button>');
    
    const pagesContainer = $('<div class="episodePages"></div>');
    
    if (currentEpisodesPage > 3) {
        pagesContainer.append('<div class="episodePage" data-page="1">1</div>');
        if (currentEpisodesPage > 4) {
            pagesContainer.append('<div class="episodePage dots">...</div>');
        }
    }
    
    let start = Math.max(1, currentEpisodesPage - 2);
    let end = Math.min(episodesTotalPages, currentEpisodesPage + 2);
    
    for (let i = start; i <= end; i++) {
        if (i === currentEpisodesPage) {
            pagesContainer.append(`<div class="episodePage active">${i}</div>`);
        } else {
            pagesContainer.append(`<div class="episodePage" data-page="${i}">${i}</div>`);
        }
    }
    
    if (currentEpisodesPage < episodesTotalPages - 2) {
        if (currentEpisodesPage < episodesTotalPages - 3) {
            pagesContainer.append('<div class="episodePage dots">...</div>');
        }
        pagesContainer.append(`<div class="episodePage" data-page="${episodesTotalPages}">${episodesTotalPages}</div>`);
    }
    
    pagination.append(pagesContainer);
    pagination.append('<button id="episodesNext" ' + (currentEpisodesPage === episodesTotalPages ? 'disabled' : '') + '>›</button>');
    
    $('.episodesContainer').after(pagination);
}

// Create locations pagination
function createLocationsPagination() {
    $('.locationsPagination').remove();
    
    if (locationsTotalPages <= 1) return;
    
    const pagination = $('<div class="locationsPagination"></div>');
    pagination.append('<button id="locationsPrev" ' + (currentLocationsPage === 1 ? 'disabled' : '') + '>‹</button>');
    
    const pagesContainer = $('<div class="locationPages"></div>');
    
    if (currentLocationsPage > 3) {
        pagesContainer.append('<div class="locationPage" data-page="1">1</div>');
        if (currentLocationsPage > 4) {
            pagesContainer.append('<div class="locationPage dots">...</div>');
        }
    }
    
    let start = Math.max(1, currentLocationsPage - 2);
    let end = Math.min(locationsTotalPages, currentLocationsPage + 2);
    
    for (let i = start; i <= end; i++) {
        if (i === currentLocationsPage) {
            pagesContainer.append(`<div class="locationPage active">${i}</div>`);
        } else {
            pagesContainer.append(`<div class="locationPage" data-page="${i}">${i}</div>`);
        }
    }
    
    if (currentLocationsPage < locationsTotalPages - 2) {
        if (currentLocationsPage < locationsTotalPages - 3) {
            pagesContainer.append('<div class="locationPage dots">...</div>');
        }
        pagesContainer.append(`<div class="locationPage" data-page="${locationsTotalPages}">${locationsTotalPages}</div>`);
    }
    
    pagination.append(pagesContainer);
    pagination.append('<button id="locationsNext" ' + (currentLocationsPage === locationsTotalPages ? 'disabled' : '') + '>›</button>');
    
    $('.locationsContainer').after(pagination);
}

// Show autocomplete suggestions for watchlist search
function showAutocompleteSuggestions(searchTerm, inputId) {
    if (!searchTerm || searchTerm.length < 1) {
        $(`#${inputId}`).closest('.autocomplete-container').find('.autocomplete-dropdown').removeClass('active').empty();
        return;
    }
    
    const suggestions = allEpisodes.filter(ep => 
        ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.episode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.air_date.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
    
    const dropdown = $(`#${inputId}`).closest('.autocomplete-container').find('.autocomplete-dropdown');
    dropdown.empty();
    
    if (suggestions.length === 0) {
        dropdown.html(`
            <div class="autocomplete-item">
                <div class="episode-name" style="color: #bdc3c7; width: 100%; text-align: center;">
                    No episodes found
                </div>
            </div>
        `);
    } else {
        suggestions.forEach(ep => {
            const isInWatchlist = episodesStorage.some(storedEp => storedEp.id == ep.id);
            
            dropdown.append(`
                <div class="autocomplete-item" data-id="${ep.id}" data-name="${ep.name}" data-code="${ep.episode}">
                    <div class="episode-code">${ep.episode}</div>
                    <div class="episode-name">${ep.name}</div>
                    <div class="episode-date">${ep.air_date}</div>
                    <button class="${isInWatchlist ? 'added-btn' : 'add-btn'}">
                        <i class="fas ${isInWatchlist ? 'fa-check' : 'fa-plus'}"></i>
                        ${isInWatchlist ? 'Added' : 'Add'}
                    </button>
                </div>
            `);
        });
    }
    
    dropdown.addClass('active');
}

// Handle autocomplete input
function handleAutocompleteInput(e) {
    const searchTerm = $(this).val().trim();
    const inputId = $(this).attr('id');
    clearTimeout(autocompleteTimeout);
    
    if (searchTerm.length >= 1) {
        autocompleteTimeout = setTimeout(() => {
            showAutocompleteSuggestions(searchTerm, inputId);
        }, 300);
    } else {
        $(this).closest('.autocomplete-container').find('.autocomplete-dropdown').removeClass('active').empty();
    }
}

// Hide autocomplete suggestions
function hideAutocompleteSuggestions() {
    $('.autocomplete-dropdown').removeClass('active');
}

// Add episode from autocomplete
function addEpisodeFromAutocomplete(id) {
    const episode = allEpisodes.find(ep => ep.id == id);
    
    if (!episode) {
        showNotification('Error: Episode not found!', 'error');
        return;
    }
    
    // Check if already in watchlist
    if (episodesStorage.some(ep => ep.id == id)) {
        showNotification('This episode is already in your watchlist!', 'info');
        return;
    }
    
    const episodeData = {
        ...episode,
        watched: false
    };
    
    episodesStorage.push(episodeData);
    localStorage.setItem('episodesStorage', JSON.stringify(episodesStorage));
    
    // Update autocomplete button
    $(`.autocomplete-item[data-id="${id}"] button`)
        .removeClass('add-btn')
        .addClass('added-btn')
        .html('<i class="fas fa-check"></i> Added');
    
    // Clear search input
    $('#searchEpisode').val('');
    
    // Hide autocomplete
    hideAutocompleteSuggestions();
    
    showNotification(`"${episodeData.name}" added to watchlist!`, 'success');
    
    // Refresh watchlist
    showWatchlist();
    
    // Update episodes page buttons if on episodes page
    if ($('.episodespage').is(':visible')) {
        updateEpisodesPageButtons();
    }
}

// Add episode from episodes page autocomplete
function addEpisodeFromEpisodesPageAutocomplete(id) {
    const episode = allEpisodes.find(ep => ep.id == id);
    
    if (!episode) {
        showNotification('Error: Episode not found!', 'error');
        return;
    }
    
    // Check if already in watchlist
    if (episodesStorage.some(ep => ep.id == id)) {
        showNotification('This episode is already in your watchlist!', 'info');
        return;
    }
    
    const episodeData = {
        ...episode,
        watched: false
    };
    
    episodesStorage.push(episodeData);
    localStorage.setItem('episodesStorage', JSON.stringify(episodesStorage));
    
    // Update autocomplete button
    $(`.episodespage .autocomplete-item[data-id="${id}"] button`)
        .removeClass('add-btn')
        .addClass('added-btn')
        .html('<i class="fas fa-check"></i> Added');
    
    showNotification(`"${episodeData.name}" added to watchlist!`, 'success');
    
    // Refresh episodes page buttons
    updateEpisodesPageButtons();
    
    // Refresh watchlist if on watchlist page
    if ($('.watchlistpage').is(':visible')) {
        showWatchlist();
    }
}

// Add custom episode
function addCustomEpisode() {
    const code = $('#episodeCode').val().trim();
    const name = $('#episodeName').val().trim();
    const date = $('#episodeDate').val().trim();
    
    if (!code || !name) {
        showNotification('Please fill in at least episode code and name!', 'error');
        return;
    }
    
    // Check if episode with same code already exists
    if (episodesStorage.some(ep => ep.episode === code)) {
        showNotification('An episode with this code already exists!', 'error');
        return;
    }
    
    const customEpisode = {
        id: Date.now(),
        episode: code,
        name: name,
        air_date: date || 'Unknown',
        characters: [],
        url: '',
        created: new Date().toISOString(),
        watched: false,
        custom: true
    };
    
    episodesStorage.push(customEpisode);
    localStorage.setItem('episodesStorage', JSON.stringify(episodesStorage));
    
    // Clear form
    $('#episodeCode').val('');
    $('#episodeName').val('');
    $('#episodeDate').val('');
    
    // Auto-search for similar episodes on episodes page
    const searchTerm = name.split(' ')[0].toLowerCase();
    if ($('.episodespage').is(':visible')) {
        $('#episodeSearchInput').val(searchTerm);
        searchAndFilterEpisodes();
    }
    
    showNotification(`Custom episode "${name}" added to watchlist!`, 'success');
    
    // Refresh watchlist if on watchlist page
    if ($('.watchlistpage').is(':visible')) {
        showWatchlist();
    }
}

// Toggle quick add form
function toggleQuickAddForm() {
    const form = $('.quick-add-form');
    const button = $('#toggleQuickAdd');
    
    if (form.is(':visible')) {
        form.slideUp();
        button.html('<i class="fas fa-plus"></i> Show Quick Add Form');
    } else {
        form.slideDown();
        button.html('<i class="fas fa-minus"></i> Hide Quick Add Form');
    }
}

// Update episodes page buttons (after adding from watchlist)
function updateEpisodesPageButtons() {
    $('.ADDBtn').each(function() {
        const id = $(this).data('id');
        const isInWatchlist = episodesStorage.some(ep => ep.id == id);
        
        if (isInWatchlist) {
            $(this).addClass('added')
                .html('<i class="fas fa-check"></i> Added to Watchlist');
        } else {
            $(this).removeClass('added')
                .html('<i class="fas fa-plus"></i> Add to Watchlist');
        }
    });
}

// Show watchlist with stats
function showWatchlist() {
    const watchlistContent = $('.watchlist-content');
    watchlistContent.empty();
    
    // Calculate stats
    const totalEpisodes = episodesStorage.length;
    const watchedEpisodes = episodesStorage.filter(ep => ep.watched).length;
    const unwatchedEpisodes = totalEpisodes - watchedEpisodes;
    
    // Add stats section
    watchlistContent.append(`
        <div class="watchlistStats">
            <div class="statItem total">
                <div class="statValue">${totalEpisodes}</div>
                <div class="statLabel">Total Episodes</div>
            </div>
            <div class="statItem watched">
                <div class="statValue">${watchedEpisodes}</div>
                <div class="statLabel">Watched</div>
            </div>
            <div class="statItem unwatched">
                <div class="statValue">${unwatchedEpisodes}</div>
                <div class="statLabel">To Watch</div>
            </div>
        </div>
    `);
    
    // Create container for episodes
    const episodesContainer = $('<div class="watchlistContainer"></div>');
    
    if (episodesStorage.length === 0) {
        episodesContainer.html(`
            <div class="no-results">
                <i class="fas fa-bookmark"></i>
                <h3>Your watchlist is empty</h3>
                <p>Add episodes from the search above</p>
            </div>
        `);
    } else {
        // Sort episodes: unwatched first, then by episode code
        const sortedEpisodes = [...episodesStorage].sort((a, b) => {
            if (a.watched !== b.watched) {
                return a.watched ? 1 : -1;
            }
            return a.episode.localeCompare(b.episode);
        });
        
        sortedEpisodes.forEach(el => {
            const isWatched = el.watched || false;
            const isCustom = el.custom || false;
            
            episodesContainer.append(`
                <div class="watchlistItem">
                    <p class="${isWatched ? 'ifWatced' : ''}">${el.episode} - ${el.name}</p>
                    <p>${el.air_date} ${isCustom ? '<span style="color: #f39c12; font-size: 0.8rem;">(Custom)</span>' : ''}</p>
                    <div class="watchlistInfo">
                        <div>
                            <button class="removeBtn" data-id="${el.id}">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                            <button class="watchedBtn" data-id="${el.id}">
                                <i class="fas ${isWatched ? 'fa-eye-slash' : 'fa-eye'}"></i>
                                ${isWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
                            </button>
                        </div>
                        <div class="watchlistStatus ${isWatched ? 'watched' : 'unwatched'}">
                            ${isWatched ? '✓ Watched' : '● To Watch'}
                        </div>
                    </div>
                </div>
            `);
        });
    }
    
    watchlistContent.append(episodesContainer);
}

// Mark episode as watched
function markAsWatched(id) {
    for(let i = 0; i < episodesStorage.length; i++){
        if(episodesStorage[i].id == id){
            episodesStorage[i].watched = !episodesStorage[i].watched;
            localStorage.setItem('episodesStorage', JSON.stringify(episodesStorage));
            showWatchlist();
            showNotification(`Episode marked as ${episodesStorage[i].watched ? 'watched' : 'unwatched'}!`);
            break;
        }
    }
}

// Remove episode from watchlist
function removeFromWatchlist(id) {
    for (let i = 0; i < episodesStorage.length; i++) {
        if (episodesStorage[i].id == id) {
            const episodeName = episodesStorage[i].name;
            episodesStorage.splice(i, 1);
            localStorage.setItem('episodesStorage', JSON.stringify(episodesStorage));
            
            // Update search result button if it exists
            $(`.result-actions button[data-id="${id}"]`)
                .removeClass('added')
                .addClass('add-from-search')
                .html('<i class="fas fa-plus"></i> Add');
            
            // Update episodes page buttons
            updateEpisodesPageButtons();
            
            showNotification(`"${episodeName}" removed from watchlist!`, 'info');
            
            // Refresh watchlist
            showWatchlist();
            break;
        }
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notification
    $('.notification').remove();
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    const bgColor = type === 'success' ? 'linear-gradient(135deg, #2ecc71, #27ae60)' : 
                    type === 'error' ? 'linear-gradient(135deg, #e74c3c, #c0392b)' :
                    'linear-gradient(135deg, #3498db, #2980b9)';
    
    const notification = $(`
        <div class="notification" style="background: ${bgColor}">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `);
    
    $('body').append(notification);
    
    // Show notification
    setTimeout(() => {
        notification.addClass('show');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.removeClass('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Update active navigation button
function updateActiveNavButton(activeBtn) {
    $('.allBtn').removeClass('active');
    $(`#${activeBtn}`).addClass('active');
}

// Initialize autocomplete on watchlist page
function initWatchlistAutocomplete() {
    // Create autocomplete container for watchlist search
    const searchContainer = $('.search-input-group');
    if (searchContainer.length && !searchContainer.find('.autocomplete-container').length) {
        const input = searchContainer.find('#searchEpisode');
        const container = $('<div class="autocomplete-container"></div>');
        const dropdown = $('<div class="autocomplete-dropdown"></div>');
        
        input.wrap(container);
        input.after(dropdown);
    }
}

// Initialize app
$(document).ready(function() {
    // Scroll event listener
    $(window).on('scroll', handleScroll);
    
    // Back to top button
    $(document).on('click', '.back-to-top', function() {
        $('html, body').animate({ scrollTop: 0 }, 500);
    });
    
    // Autocomplete input handling
    $(document).on('input', '#searchEpisode, #episodeSearchInput', handleAutocompleteInput);
    
    $(document).on('blur', '#searchEpisode, #episodeSearchInput', function() {
        setTimeout(() => {
            hideAutocompleteSuggestions();
        }, 200);
    });
    
    // Handle click on autocomplete item (not on button)
    $(document).on('click', '.autocomplete-item', function(e) {
        if (!$(e.target).hasClass('add-btn') && !$(e.target).hasClass('added-btn') && !$(e.target).closest('button').length) {
            const id = $(this).data('id');
            const name = $(this).data('name');
            
            // Determine which page we're on
            if ($('.watchlistpage').is(':visible')) {
                // On watchlist page
                $('#searchEpisode').val(name);
                addEpisodeFromAutocomplete(id);
            } else if ($('.episodespage').is(':visible')) {
                // On episodes page
                $('#episodeSearchInput').val(name);
                addEpisodeFromEpisodesPageAutocomplete(id);
            }
        }
    });
    
    // Handle click on add button in autocomplete
    $(document).on('click', '.autocomplete-item .add-btn', function(e) {
        e.stopPropagation();
        const id = $(this).closest('.autocomplete-item').data('id');
        
        // Determine which page we're on
        if ($('.watchlistpage').is(':visible')) {
            // On watchlist page
            addEpisodeFromAutocomplete(id);
        } else if ($('.episodespage').is(':visible')) {
            // On episodes page
            addEpisodeFromEpisodesPageAutocomplete(id);
        }
    });
    
    // Add custom episode
    $(document).on('click', '#manualAddBtn', addCustomEpisode);
    
    // Toggle quick add form
    $(document).on('click', '#toggleQuickAdd', toggleQuickAddForm);
    
    // Apply filters for characters
    $(document).on('click', '#applyFilters', function() {
        currentFilters.status = $('#statusFilter').val();
        currentFilters.gender = $('#genderFilter').val();
        currentPage = 1;
        getCharacters(currentPage, currentFilters);
    });
    
    // Reset filters for characters
    $(document).on('click', '#resetFilters', function() {
        $('#statusFilter').val('all');
        $('#genderFilter').val('all');
        currentFilters = { status: 'all', gender: 'all' };
        currentPage = 1;
        getCharacters(currentPage, currentFilters);
    });
    
    // Characters pagination click
    $(document).on('click', '.page-number:not(.active):not(.dots)', function() {
        let page = $(this).data('page');
        if (page) {
            currentPage = page;
            getCharacters(currentPage, currentFilters);
            $('html, body').animate({ scrollTop: $('.characterspage').offset().top - 80 }, 300);
        }
    });
    
    // Previous page for characters
    $(document).on('click', '#prevPage', function() {
        if (currentPage > 1 && !$(this).prop('disabled')) {
            currentPage--;
            getCharacters(currentPage, currentFilters);
            $('html, body').animate({ scrollTop: $('.characterspage').offset().top - 80 }, 300);
        }
    });
    
    // Next page for characters
    $(document).on('click', '#nextPage', function() {
        if (currentPage < totalPages && !$(this).prop('disabled')) {
            currentPage++;
            getCharacters(currentPage, currentFilters);
            $('html, body').animate({ scrollTop: $('.characterspage').offset().top - 80 }, 300);
        }
    });
    
    // Episodes pagination
    $(document).on('click', '#episodesPrev', function() {
        if (currentEpisodesPage > 1 && !$(this).prop('disabled')) {
            currentEpisodesPage--;
            loadEpisodes(currentEpisodesPage);
            $('html, body').animate({ scrollTop: $('.episodesContainer').offset().top - 80 }, 300);
        }
    });
    
    $(document).on('click', '#episodesNext', function() {
        if (currentEpisodesPage < episodesTotalPages && !$(this).prop('disabled')) {
            currentEpisodesPage++;
            loadEpisodes(currentEpisodesPage);
            $('html, body').animate({ scrollTop: $('.episodesContainer').offset().top - 80 }, 300);
        }
    });
    
    $(document).on('click', '.episodePage:not(.active):not(.dots)', function() {
        let page = $(this).data('page');
        if (page) {
            currentEpisodesPage = page;
            loadEpisodes(currentEpisodesPage);
            $('html, body').animate({ scrollTop: $('.episodesContainer').offset().top - 80 }, 300);
        }
    });
    
    // Locations pagination
    $(document).on('click', '#locationsPrev', function() {
        if (currentLocationsPage > 1 && !$(this).prop('disabled')) {
            currentLocationsPage--;
            loadLocations(currentLocationsPage);
            $('html, body').animate({ scrollTop: $('.locationsContainer').offset().top - 80 }, 300);
        }
    });
    
    $(document).on('click', '#locationsNext', function() {
        if (currentLocationsPage < locationsTotalPages && !$(this).prop('disabled')) {
            currentLocationsPage++;
            loadLocations(currentLocationsPage);
            $('html, body').animate({ scrollTop: $('.locationsContainer').offset().top - 80 }, 300);
        }
    });
    
    $(document).on('click', '.locationPage:not(.active):not(.dots)', function() {
        let page = $(this).data('page');
        if (page) {
            currentLocationsPage = page;
            loadLocations(currentLocationsPage);
            $('html, body').animate({ scrollTop: $('.locationsContainer').offset().top - 80 }, 300);
        }
    });
    
    // Apply episodes filter
    $(document).on('click', '#applyEpisodesFilter', searchAndFilterEpisodes);
    
    // Clear episode search
    $(document).on('click', '#clearEpisodeSearch', clearEpisodeSearch);
    
    // Episode search on episodes page
    $(document).on('click', '#episodeSearchBtn', searchAndFilterEpisodes);
    
    // Apply locations filter
    $(document).on('click', '#locationSearchBtn', searchAndFilterLocations);
    
    // Clear location search
    $(document).on('click', '#clearLocationSearch', clearLocationSearch);
    
    // View character details
    $('.wrap').on('click', '.viewBtn', function(){
        let id = $(this).attr('id');
        $('.popup').css('display', 'flex');
        $('.wrap').css('filter', 'blur(5px)');
    
        $('.popup').empty();
        $('.popup').append('<div class="popup-close">×</div>');
        
        axios.get('https://rickandmortyapi.com/api/character/' + id)
        .then((res) => {
            $('.popup').append(`
                <div class="characterItem">
                    <div class="characterImage">
                        <img src="${res.data.image}" alt="${res.data.name}">
                    </div>
                    <div class="characterInfo">
                        <p>${res.data.name}</p>
                        <p><strong>Status:</strong> ${res.data.status}</p>
                        <p><strong>Gender:</strong> ${res.data.gender}</p>
                        <p><strong>Species:</strong> ${res.data.species}</p>
                        <p><strong>Origin:</strong> ${res.data.origin.name}</p>
                        <p><strong>Last location:</strong> ${res.data.location.name}</p>
                    </div>
                </div>
            `)
        });
    });
    
    // Add episode to watchlist from episodes page
    $('.wrap').on('click', '.ADDBtn:not(.added)', function() {
        const id = $(this).data('id');
        
        // Check if already in watchlist
        if (episodesStorage.some(ep => ep.id == id)) {
            return;
        }
        
        const episode = allEpisodes.find(ep => ep.id == id);
        
        if (!episode) {
            showNotification('Error: Episode not found!', 'error');
            return;
        }
        
        const episodeData = {
            ...episode,
            watched: false
        };
        
        episodesStorage.push(episodeData);
        localStorage.setItem('episodesStorage', JSON.stringify(episodesStorage));
        
        // Update button
        $(this).addClass('added')
            .html('<i class="fas fa-check"></i> Added to Watchlist');
        
        showNotification(`"${episodeData.name}" added to watchlist!`, 'success');
        
        // Refresh watchlist if on watchlist page
        if ($('.watchlistpage').is(':visible')) {
            showWatchlist();
        }
    });
    
    // View location residents
    $('.wrap').on('click', '.viewResidentsBtn', function() {
        const id = $(this).data('id');
        $('.popup').css('display', 'flex');
        $('.wrap').css('filter', 'blur(5px)');
    
        $('.popup').empty();
        $('.popup').append('<div class="popup-close">×</div>');
        
        $('.popup').append('<div class="loading" style="color: #333; padding: 20px;"><i class="fas fa-spinner fa-spin"></i><h3>Loading residents...</h3></div>');
        
        axios.get('https://rickandmortyapi.com/api/location/' + id)
        .then((res) => {
            const location = res.data;
            $('.popup').empty();
            $('.popup').append('<div class="popup-close">×</div>');
            $('.popup').append(`
                <div style="padding: 20px; width: 100%;">
                    <h2 style="color: #9b59b6; margin-bottom: 10px;">${location.name}</h2>
                    <p><strong>Type:</strong> ${location.type}</p>
                    <p><strong>Dimension:</strong> ${location.dimension}</p>
                    <p><strong>Residents:</strong> ${location.residents.length}</p>
                    <div style="margin-top: 20px; max-height: 400px; overflow-y: auto;">
                        <h3 style="color: #333; margin-bottom: 10px;">Residents:</h3>
                        <div class="residents-list" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;"></div>
                    </div>
                </div>
            `);
            
            // Load residents
            const residentPromises = location.residents.slice(0, 10).map(url => axios.get(url));
            
            Promise.all(residentPromises)
            .then(responses => {
                const residentsList = $('.residents-list');
                responses.forEach(res => {
                    const character = res.data;
                    residentsList.append(`
                        <div style="text-align: center; width: 100px;">
                            <img src="${character.image}" alt="${character.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin-bottom: 5px;">
                            <p style="font-size: 12px; color: #333; margin: 0;">${character.name}</p>
                        </div>
                    `);
                });
            })
            .catch(error => {
                console.error('Error loading residents:', error);
                $('.residents-list').html('<p style="color: #e74c3c;">Error loading residents</p>');
            });
        })
        .catch(error => {
            console.error('Error loading location:', error);
            $('.popup').html('<div style="padding: 20px; color: #333;"><p>Error loading location details</p></div>');
        });
    });
    
    // Remove from watchlist
    $('.wrap').on('click', '.removeBtn', function() {
        const id = $(this).data('id');
        removeFromWatchlist(id);
    });
    
    // Mark as watched
    $('.wrap').on('click', '.watchedBtn', function() {
        const id = $(this).data('id');
        markAsWatched(id);
    });
    
    // Navigation buttons
    $('#homeBtn').click(function(){
        $('.homepage').css('display', 'flex');
        $('.characterspage').css('display', 'none');
        $('.episodespage').css('display', 'none');
        $('.locationspage').css('display', 'none');
        $('.watchlistpage').css('display', 'none');
        updateActiveNavButton('homeBtn');
        $('html, body').animate({ scrollTop: 0 }, 300);
    });
    
    $('#charactersBtn').click(function(){
        $('.homepage').css('display', 'none');
        $('.characterspage').css('display', 'flex');
        $('.episodespage').css('display', 'none');
        $('.locationspage').css('display', 'none');
        $('.watchlistpage').css('display', 'none');
        updateActiveNavButton('charactersBtn');
        $('html, body').animate({ scrollTop: $('.characterspage').offset().top - 80 }, 300);
        
        if ($('.characterContainer').is(':empty')) {
            getCharacters(currentPage);
        }
    });
    
    $('#episodesBtn').click(function(){
        $('.homepage').css('display', 'none');
        $('.characterspage').css('display', 'none');
        $('.episodespage').css('display', 'flex');
        $('.locationspage').css('display', 'none');
        $('.watchlistpage').css('display', 'none');
        updateActiveNavButton('episodesBtn');
        
        initEpisodesPage();
        loadEpisodes();
        $('html, body').animate({ scrollTop: $('.episodespage').offset().top - 80 }, 300);
    });
    
    $('#locationsBtn').click(function(){
        $('.homepage').css('display', 'none');
        $('.characterspage').css('display', 'none');
        $('.episodespage').css('display', 'none');
        $('.locationspage').css('display', 'flex');
        $('.watchlistpage').css('display', 'none');
        updateActiveNavButton('locationsBtn');
        
        initLocationsPage();
        loadLocations();
        $('html, body').animate({ scrollTop: $('.locationspage').offset().top - 80 }, 300);
    });
    
    $('#watchlistBtn').click(function(){
        $('.homepage').css('display', 'none');
        $('.characterspage').css('display', 'none');
        $('.episodespage').css('display', 'none');
        $('.locationspage').css('display', 'none');
        $('.watchlistpage').css('display', 'flex');
        updateActiveNavButton('watchlistBtn');
        initWatchlistAutocomplete();
        showWatchlist();
        $('html, body').animate({ scrollTop: $('.watchlistpage').offset().top - 80 }, 300);
    });
    
    // Close popup
    $(document).on('click', '.popup-close', function() {
        $('.popup').css('display', 'none');
        $('.wrap').css('filter', 'blur(0px)');
    });
    
    $(document).on('click', '.popup', function(e) {
        if ($(e.target).hasClass('popup')) {
            $('.popup').css('display', 'none');
            $('.wrap').css('filter', 'blur(0px)');
        }
    });
});

// New function for initial character loading
function loadInitialCharacters() {
    isLoading = true;
    
    let url = `https://rickandmortyapi.com/api/character?page=${currentPage}`;
    
    axios.get(url)
    .then((res) => {
        totalPages = res.data.info.pages;
        
        if (res.data.results.length === 0) {
            $('.characterContainer').html(`
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No characters found</h3>
                    <p>Try changing filters</p>
                </div>
            `);
            $('.pagination').hide();
        } else {
            $('.pagination').show();
            
            for(let el of res.data.results){
                $('.characterContainer').append(`
                    <div class="characterItem">
                        <div class="characterImage">
                            <img src="${el.image}" alt="${el.name}">
                        </div>
                        <div class="characterInfo">
                            <p>${el.name}</p>
                            <p><strong>Status:</strong> ${el.status}</p>
                            <p><strong>Gender:</strong> ${el.gender}</p>
                            <p><strong>Species:</strong> ${el.species}</p>
                            <button class="viewBtn" id="${el.id}">View Details</button>
                        </div>
                    </div>
                `);
            }
        }
        
        createPagination();
        updateFilterIndicators();
        isLoading = false;
    })
    .catch((error) => {
        console.error('Loading error:', error);
        
        $('.characterContainer').html(`
            <div class="error">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Loading error</h3>
                <p>Please try again</p>
            </div>
        `);
        
        isLoading = false;
    });
}