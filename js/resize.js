
/**
 * @returns {string} the size of the screen according to bootstrap ("xs", "sm", "md", "lg" or "xl")
 */
function bootstrap_screen_size() {
    return $('#sizer').find('div:visible').data('size')
}

function navbar_collapsing() {
    const active_tab_name = $("#nav-tabs .nav-link.active").text()
    $("#nav-tabs-collasped").children().first().children().first().text(active_tab_name)
}

$(() => {
    const size = bootstrap_screen_size()
    if (size === "xs" || size === "sm")
        navbar_collapsing()
    $(window).resize(_ => {
        const size = bootstrap_screen_size()
        if (size === "xs" || size === "sm")
            navbar_collapsing()
    })
})
