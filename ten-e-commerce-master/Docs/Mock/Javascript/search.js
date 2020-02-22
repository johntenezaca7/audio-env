var IS_SEARCHING = 0;
var BRANDS_WITH_COLOR = ['omnilife', 'seytu', 'nfuerza'];

function renderTitle(title) {
    var item;
    item = '<div class="search-result product">';
    item += '<h3 class="search-row search-row-header">';
    item += title;
    item += '</h3>';
    item += '</div>';

    return item;
}

function renderBrand(brand) {
    if (brand != '') {
        var filteredBrand = brand.toLowerCase().latinize();
        var color = (BRANDS_WITH_COLOR.indexOf(filteredBrand) != -1) ? filteredBrand : 'default';
        var span = '<span class="small-label ' + color + '">' + brand + '</span>';
        return span;
    } else {
        return '';
    }
}

function renderLink(result) {
    var item;
    item = '<div class="search-result product">';
    item += '<a href="' + result.link + '">';
    item += '<h3 class="search-row" style="display: flex">';
    item += result.header;
    if (result.brands != undefined) {
        result.brands.forEach(function (brand) {
            item += renderBrand(brand);
        });
    } else {
        item += renderBrand(result.brand);
    }
    item += '</h3>';
    item += '<p class="search-row-description">' + result.description + '</p>';
    item += '</a>';
    item += '</div>';

    return item;
}

function renderResults(results) {
    var html = '';
    results.forEach(function (result) {
        html += renderTitle(result.title);
        result.links.forEach(function (link) {
            html += renderLink(link);
        });
    });

    $('#global-search-results').html(html);
}


function globalSearch(search) {
    if (IS_SEARCHING == 0) {
        $.ajax({
            url: _GLOBAL_SEARCH_URL,
            type: 'POST',
            data: {
                _token: _CSRF_TOKEN,
                search: search,
                isDA: _GLOBAL_SEARCH_DA,
            },
            beforeSend: function () {
                $('#global-search-container').show().scrollTop(0);
                $('#global-search-results').hide();
                $('#global-search-empty').hide();
                $('#global-search-error').hide();
                $('#global-search-loading').show();
                IS_SEARCHING = 1;
            },
            success: function (response) {
                if (response.length > 0) {
                    renderResults(response);
                    $('#global-search-loading').hide();
                    $('#global-search-results').show();
                } else {
                    $('#global-search-loading').hide();
                    $('#global-search-empty').show();
                }
                IS_SEARCHING = 0;
            },
            statusCode: {
                419: function () {
                    window.location.href = URL_PROJECT;
                },
                500: function () {
                    $('#global-search-loading').hide();
                    $('#global-search-error').show();
                    IS_SEARCHING = 0;
                }
            }
        });
    }
}

$('#global-search').on('keypress', function (e) {
    var value = $(this).val();
    if (e.which == 13 && value != '') {
        globalSearch(value);
        return false;
    }
});
