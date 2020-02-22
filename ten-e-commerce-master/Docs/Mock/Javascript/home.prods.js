var globalBrandCategories;
var activeCategoryId;
var _CSRF_TOKEN =  "3kcNzCZdb9LGCKPWZ5VWDi0auiHJRw8gN12bARh5";
var GET_PRODUCTS_URL = "https://portal.omnilife.com/web_api/products";

function changeCategoryUrl(select) {
    $('a.button.button--products.small').attr('href', $(select).find(":selected").data('url'));
}

function printBrandCategory(brandCategory, isFirstBrand) {
    var select = $('<select onchange="changeCategoryUrl(this)"></select>').attr({ 'class' : 'form-control select-category',
        'name' : 'category', 'id' : 'select-brand-' + brandCategory.brand.id });
    brandCategory.categories.forEach(function (category, index) {
        if (category.home_products > 0) {
            var opt = $('<option></option>').attr({ 'value' : category.id, 'data-url': category.url }).html(category.name);
            select.append(opt);
            if (index == 0 && isFirstBrand) {
                activeCategoryId = opt.val();
                $('a.button.button--products.small').attr('href', category.url);
            }
        }
    });
    var divCategories = $('<div></div>').attr({ 'class' : 'select select--categories' }).append(select);
    var divTools = $('<div></div>').attr({ 'class' : 'tools__form-group' }).append(divCategories);
    return divTools;
}

function printBrandTabs(brandCategories) {
    var divTabs = $('<div></div>').attr({ 'class' : 'tabs'});
    var divTabsHeader = $('<div></div>').attr({ 'class' : 'tabs__header'});
    var isFirstTab = true;
    brandCategories.forEach(function (brandCategory, index) {
        if(brandCategory.categories.length > 0) {
            var tabContent = '<a href="#">' + brandCategory.brand.alias + '</a>';
            var tab = $('<div></div>').append(tabContent)
                .attr({'class': 'tabs__item', 'data-target': brandCategory.brand.id, 'onclick': "return false"});
            if (isFirstTab) {
                tab.addClass('active');
                isFirstTab = false;
            }
            divTabsHeader.append(tab);
        }
    });
    var divCategories = $('<div></div>').attr({ 'class' : 'tabs__content', 'id' : 'productsCategory' });
    isFirstTab = true;
    brandCategories.forEach(function (brandCategory, index) {
        if(brandCategory.categories.length > 0) {
            var tabPane = $('<div></div>').attr({'class': 'tabs__pane', 'id': 'tab-pane-' + brandCategory.brand.id});
            if (isFirstTab) {
                tabPane.addClass('active').append(printBrandCategory(brandCategory, true));
                isFirstTab = false;
            } else {
                tabPane.append(printBrandCategory(brandCategory, false));
            }
            divCategories.append(tabPane);
        }
    });
    divTabs.append(divTabsHeader).append(divCategories);

    return divTabs;
}

function generateCategories(brandCategories, show_tabs) {
    var categoriesWrapper = $('#categories-wrapper');
    if (brandCategories.length > 1 || show_tabs) {
        categoriesWrapper.append(printBrandTabs(brandCategories));
    } else {
        categoriesWrapper.append(printBrandCategory(brandCategories[0], true));
    }
    if(categoriesWrapper.find(".select--categories option").length > 0) {
        var description = $('<p></p>').attr({'class': 'products-desc__description', 'id': 'products-description'});
        categoriesWrapper.append(description);
        setDescription();
    } else {
        $('#categories-wrapper').closest(".products-desc").remove();
    }
}

function setDescription() {
    globalBrandCategories.forEach(function (brandCategory) {
        brandCategory.categories.forEach(function (category) {
            if (activeCategoryId == category.id) {
                $('#products-description').html(category.description);
                getProducts();
            }
        });
    });
}

function setActiveTab(tab) {
    $('.tabs__item').removeClass('active');
    $('.tabs__pane').removeClass('active');
    tab.addClass('active');
    var dataTarget = tab.attr('data-target');

    $('a.button.button--products.small').attr('href', $('#select-brand-'+dataTarget).find(":selected").data('url'));

    $('#tab-pane-' + dataTarget).addClass('active');
    activeCategoryId = $('#select-brand-' + dataTarget).val();
    setDescription();
}

function categoryComboChange(option) {
    activeCategoryId = option.val();
    setDescription();
}

function printProducts(products, shopping_active, is_ws_active, is_logged, showDisclaimer, disclaimer) {
    hideProducts();
    if (products.length > 0) {
        var homeProducts = $('#home-products');
        homeProducts.html('');
        products.forEach(function (product) {
            if (product.showBuyButton) {
                var footer = null;
                var h3 = $('<h3></h3>').attr({'class': 'product__name'}).html(product.name);
                var img = $('<img>').attr({'src': PUBLIC_URL + product.image, 'alt': product.name});

                var notProductClass = !product.showBuyButton && show_add_to_car() ? ' is-not-available' : '';

                var figure = $('<figure></figure>').attr({'class': 'product__image' + notProductClass}).append(img);
                var p = $('<p></p>').attr({'class': 'product__description'}).html(product.description);

                var spanPrice = $('<span></span>').attr({'class': 'product__price'}).html(show_price() ? product.price : '');
                var spanPoints = $('<span></span>').attr({'class': 'product__pts'}).html(show_points() ? product.points + ' ' + get_points_translation(product.points, '', 'shopping::register.kit.bill.points2') : '');
                var spanNums = $('<span></span>').attr({'class': 'product__nums'}).append(spanPrice).append(spanPoints);

                var link = $('<a></a>').attr({'class': 'product__link', 'href': product.url})
                    .append(h3).append(figure).append(p).append(spanNums);

                var separator = $('<div class="product__sep"></div>');
                var btn = $('<button></button>').attr({
                    'class': 'alertButton_' + product.id + ' button clean add-to-cart button--shopping cart',
                    'type': 'button',
                    'onclick': "ShoppingCart.add('" + product.id + "', 1)"
                }).html('<span>' + BUTTON_LANG + '</span>');
                var btnLogin = $('<button></button>').attr({
                    'class': 'button clean theme--brazil',
                    'type': 'button',
                    'onclick': "show_login()"
                }).html('<span>' + BUTTON_LOGPRODUCTS + '</span>');

                if (show_price()) {
                    if (product.showBuyButton) {
                        footer = $('<footer></footer>').attr({'class': 'product__f'}).append(separator).append(btn);
                    } else {
                        var alert = $('<p>' + ALERT_NOT_PRODUCTS_JS.textOne + ' <a href="' + URL_PROJECT + '/cedis" style="cursor: pointer; text-decoration: underline; color: red;" target="_blank">' + ALERT_NOT_PRODUCTS_JS.textTwo + '</a></p>').attr({'class': 'product__description is-not-available'});
                        footer = $('<footer></footer>').attr({
                            'class': 'product__f',
                            'style': 'height: 40px;'
                        }).append(separator).append(alert);
                    }
                } else if (!show_price() && !is_logged_in()) {
                    footer = $('<footer></footer>').attr({'class': 'product__f'}).append(separator).append(btnLogin);
                }

                var item = $('<div></div>').attr({'class': 'product slider__item'}).append(link);

                if (show_add_to_car()) {
                    item.append(footer);
                }

                homeProducts.append(item);
            }
        });

        if (showDisclaimer) {
            homeProducts.append('<p class="disclaimer theme--white">'+disclaimer+'</p>');
        }

        $('#home-products').show();

        $('#products-slider .slider__bullets').remove();
        new document.slider.default('products-slider', {
            navBullets: true,
            onlyMobile: true
        });

    } else {
        $('#home-products-empty').show();
    }
}

function getProducts() {
    $.ajax({
        url: GET_PRODUCTS_URL,
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': _CSRF_TOKEN
        },
        data: {
            category_id: activeCategoryId,
        },
        beforeSend: function () {
            hideProducts();
            $('#home-products-loader').show();
        },
        success: function (data, status) {
            console.log(data);
            document.products = jQuery.parseJSON(data.json_products);

            var disclaimer = '';
            if (data.showDisclaimer) {
                disclaimer = data.disclaimer;
            }

            printProducts(data.products, data.shopping_active, data.is_ws_active, data.is_logged, data.showDisclaimer, disclaimer);
        },
        statusCode: {
            419: function () {
                window.location.href = URL_PROJECT;
            }
        }
    });
}

function hideProducts() {
    $('#home-products').hide();
    $('#home-products-empty').hide();
    $('#home-products-loader').hide();
}

$(document).ready(function () {
    $.ajax({
        url: GET_CATEGORIES_URL,
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': _CSRF_TOKEN
        },
        data: {
            brand_id: BRAND_ID,
            country_id: COUNTRY_ID,
        },
        success: function (data) {
            console.log(data);
            globalBrandCategories = data.brandCategories;
            generateCategories(data.brandCategories, data.show_tabs);
        },
        statusCode: {
            419: function () {
                window.location.href = URL_PROJECT;
            }
        }
    });
    $(document).on('click', '.tabs__item', function(){
        setActiveTab($(this));
    });
    $(document).on('change', '.select-category', function(){
        categoryComboChange($(this));
    });
});
