/* Allow on and off */
(function($) {
    $.fn.uon = function(events, handler) {
        // Prevent duplication of listener handlers
        return this.off(events, handler).on(events, handler)
    }
}(jQuery));

/* Data */
const priest_energy = "Divin"
const hermetic_energy = "Hermétique"
const instinctive_magic = "Magie instinctive"

function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match) => (map[match]));
}

/**
 * Find the index of the child inside the parent based on id
 *
 * @param parent is a jquery object
 * @param child is an element object of parent
 * @returns {number} the index of the child inside the parent
 */
function find_index(parent, child) {

    let idx = 0
    parent.children().each((i, elem) => {
        if (child.id === elem.id) {
            idx = i
        }
    })
    return idx
}

// Update the title when the character name changes
$("#character-name").on("change", e => {
    const value = e.target.value
    if (value && value.length > 0)
        document.title = value
    else
        document.title = "SimulacreS"
})

// Set the right version of bootstrap for bootstrap-select
$.fn.selectpicker.Constructor.BootstrapVersion = '4'

// Dark mode

function is_dark_mode(page = $(document)) {
    return page.find("#dark-mode").hasClass("d-none")
}

function enable_dark_mode() {
    const fixes = {
        invert: [],
        css: "#svg-simulacres path {\n" +
            "    fill: ${black} !important;\n" +
            "}\n" +
            ".bs-tooltip-auto[x-placement^=bottom] .arrow::before, .bs-tooltip-bottom .arrow::before {\n" +
            "    border-bottom-color: ${white} !important;\n" +
            "}\n" +
            ".bs-tooltip-auto[x-placement^=top] .arrow::before, .bs-tooltip-top .arrow::before {\n" +
            "    border-top-color: ${white} !important;\n" +
            "}\n" +
            ".bs-tooltip-auto[x-placement^=left] .arrow::before, .bs-tooltip-left .arrow::before {\n" +
            "    border-left-color: ${white} !important;\n" +
            "}\n" +
            ".bs-tooltip-auto[x-placement^=right] .arrow::before, .bs-tooltip-right .arrow::before {\n" +
            "    border-right-color: ${white} !important;\n" +
            "}",
        ignoreInlineStyle: [],
        ignoreImageAnalysis: []
    }
    DarkReader.enable({brightness: 100, contrast: 100, sepia: 0}, fixes)
    $("#dark-mode").addClass("d-none")
    $("#light-mode").removeClass("d-none")
}

function disable_dark_mode() {
    DarkReader.disable()
    $("#light-mode").addClass("d-none")
    $("#dark-mode").removeClass("d-none")
}

$("#light-mode").on("click", _ => {
    disable_dark_mode()
})
$("#dark-mode").on("click", _ => {
    enable_dark_mode()
})

// Tab customization
function build_tab_hide_list() {
    const parent_list = $("#hide-tabs-tabs")
    parent_list.children().slice(1).remove()
    const to_clone = parent_list.children().first()
    $("#nav-tabs a[role=\"tab\"]").each((i, elem) => {
        const list_item = to_clone.clone(false, false)
        list_item.removeClass("d-none").addClass("d-flex")
        list_item.find(".show-tab").on("click", _ => {
            $(elem).removeClass("d-none")
            list_item.find(".show-tab").addClass("d-none")
            list_item.find(".hide-tab").removeClass("d-none")
        })
        list_item.find(".hide-tab").on("click", _ => {
            $(elem).addClass("d-none")
            list_item.find(".hide-tab").addClass("d-none")
            list_item.find(".show-tab").removeClass("d-none")
        })
        list_item.children().first().text($(elem).text().trim())
        parent_list.append(list_item)
    })
}

function number_filter(value, min, max) {
    return /^-?\d*$/.test(value) && (value === "" || max == null || isNaN(max) || parseInt(value) <= max)
        && (value === "" || min == null || isNaN(min) || parseInt(value) >= min)
}

$(_ => {
    /* Tooltip initializations */
    $('[data-toggle="tooltip"]:visible').tooltip()
    $('button[data-toggle="tooltip"]').tooltip()
    $('.absorption').parent().tooltip()

    // Dark mode initialization
    if (is_dark_mode()) {
        disable_dark_mode()
        enable_dark_mode()
    } else {
        disable_dark_mode()
    }

    // We enable the use of svg images inside some of the select pickers
    $("select.spell-list, select.component-select, select.special-energy-select, select.realm-energy-select, select.spell-select").each((i, elem) => {
        if (!elem.id.includes("-x-")) {
            $(elem).selectpicker({sanitize: false})
            $(elem).selectpicker("refresh")
        }
    })

    // Initialize AP computation
    compute_remaining_ap()

    // Button collapse toggle
    $(".collapse-button").on("click", e => {
        const svg = $(e.target).find("svg")
        if (svg.hasClass("fa-angle-up")) {
            svg.addClass("fa-angle-down").removeClass("fa-angle-up")
        } else {
            svg.removeClass("fa-angle-down").addClass("fa-angle-up")
        }
    })

    // Initialize tab list
    build_tab_hide_list()
})
