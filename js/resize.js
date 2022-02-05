
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

function collapse_table() {
    // Remove blank space before input due to prefix class
    $(".collapsible-table .fa-arrows-alt.d-none.prefix").removeClass("prefix")
    // Remove horizontal scroll
    $(".collapsible-table").removeClass("table-responsive").css("overflow-y", "")
}

function uncollapse_table() {
    // Re-add the handler
    $(".collapsible-table .fa-arrows-alt.d-none").addClass("prefix")
    // Add horizontal scroll
    $(".collapsible-table").addClass("table-responsive").css("overflow-y", "hidden !important")
}

function characteristics_head_to_tab() {
    $("#stats-tab").detach().insertAfter("#roll-tab").addClass("tab-pane fade")
    $("li a[href='#stats-tab']").attr("role", "tab").parent().removeClass("d-none")
    build_tab_hide_list()
}

function characteristics_tab_to_head() {
    $("#stats-tab").detach().insertAfter($("#sheet-header")).removeClass("tab-pane fade active show")
    $("li a[href='#stats-tab']").removeAttr("role").parent().addClass("d-none")
    build_tab_hide_list()
}

function resize() {
    const size = bootstrap_screen_size()
    if (size === "xs" || size === "sm") {
        navbar_collapsing()
        collapse_table()
        characteristics_head_to_tab()
    } else {
        uncollapse_table()
        characteristics_tab_to_head()
    }
}

$(() => {
    resize()
    $(window).resize(_ => {
        resize()
    })
})
