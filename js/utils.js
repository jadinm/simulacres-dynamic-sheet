/* Allow on and off */
(function ($) {
    $.fn.uon = function (events, handler) {
        // Prevent duplication of listener handlers
        return this.off(events, handler).on(events, handler)
    }
}(jQuery));

/* Data */
const priest_energy = "Divin"
const hermetic_energy = "Hermétique"
const instinctive_magic = "Magie instinctive"
const good_nature_evil_energies = ["Bien", "Mal", "Nature"]

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

// Test if there is a new version
let latest_released_version = base_tag_version
$(_ => {
    $("#download-latest-version").addClass("d-none").tooltip("dispose")
    $.get({
        url: "https://api.github.com/repos/jadinm/simulacres-dynamic-sheet/releases/latest",
        method: "GET",
        data: {},
        dataType: "json",
        success: (data) => {
            // Check if version is higher than current version (since it is only going up,
            // the latest version is the highest one as well
            latest_released_version = data["tag_name"]
            if (base_tag_version !== data["tag_name"]) {
                let new_url = $(data["assets"]).filter((i, elem) => {
                    return base_sheet_name === elem["name"]
                })

                if (new_url.length > 0) {
                    new_url = new_url[0]["browser_download_url"]
                    const dl_button = $("#download-latest-version")
                    dl_button.removeClass("d-none").attr("href", new_url)
                    dl_button.tooltip()
                }
                build_plugin_list()
            }
        },
        timeout: 2000
    })
})

// Set the right version of bootstrap for bootstrap-select
$.fn.selectpicker.Constructor.BootstrapVersion = '4'

// Dark mode

function is_dark_mode(page = $(document)) {
    return page.find("#dark-mode").hasClass("d-none")
}

const dark_fixes = {
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
        "}\n" +
        ".spell-difficulty .slider-selection {\n" +
        "    background: white;\n" +
        "    z-index: 1; /* Prevent checkboxes to overlap with it */\n" +
        "}\n" +
        ".spell-difficulty .slider-handle {\n" +
        "    background: white;\n" +
        "    z-index: 1; /* Prevent checkboxes to overlap with it */\n" +
        "}\n" +
        "#roll-dialog-modifier-slider .slider-selection {\n" +
        "    background: white;\n" +
        "}\n" +
        "#roll-dialog-modifier-slider .slider-handle {\n" +
        "    background: white;\n" +
        "}\n" +
        "#roll-dialog-effect-modifier-slider .slider-selection {\n" +
        "    background: white;\n" +
        "}\n" +
        "#roll-dialog-effect-modifier-slider .slider-handle {\n" +
        "    background: white;\n" +
        "}\n" +
        "#roll-dialog-superpower-modifier-slider .slider-selection {\n" +
        "    background: white;\n" +
        "}\n" +
        "#roll-dialog-superpower-modifier-slider .slider-handle {\n" +
        "    background: white;\n" +
        "}\n" +
        ".card.border-heavy {\n" +
        "    border-image: var(--darkModeBorder) 15% fill / 65px 65px / 0.05rem round !important;\n" +
        "}",
    ignoreInlineStyle: [],
    ignoreImageAnalysis: []
}

const dark_theme = {brightness: 100, contrast: 100, sepia: 0}

function enable_dark_mode() {
    DarkReader.enable(dark_theme, dark_fixes)
    $("#dark-mode,#dark-mode-2").addClass("d-none").tooltip("dispose")
    $("#light-mode,#light-mode-2").removeClass("d-none").tooltip()
}

function disable_dark_mode() {
    DarkReader.disable()
    $("#light-mode,#light-mode-2").addClass("d-none").tooltip("dispose")
    $("#dark-mode,#dark-mode-2").removeClass("d-none").tooltip()
}

$("#light-mode,#light-mode-2").on("click", _ => {
    disable_dark_mode()
})
$("#dark-mode,#dark-mode-2").on("click", _ => {
    enable_dark_mode()
})

// Tab customization
function build_tab_hide_list() {
    const hide_list = $("#hide-tabs-tabs")
    hide_list.children().slice(1).remove()
    const hide_to_clone = hide_list.children().first()

    const select_list = $("#select-tabs-tabs")
    select_list.children().slice(1).remove()
    const select_to_clone = select_list.children().first()

    $("#nav-tabs a[role=\"tab\"]").each((i, elem) => {
        /* Set hide list */
        const tab_name = $(elem).text().trim()
        let list_item = hide_to_clone.clone(false, false)
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
        list_item.children().first().children().first().val(tab_name).on("change", e => {
            $(elem).text($(e.target).val().trim())
        })

        if ($(elem).hasClass("d-none")) {
            list_item.find(".show-tab").removeClass("d-none")
            list_item.find(".hide-tab").addClass("d-none")
        } else {
            list_item.find(".show-tab").addClass("d-none")
            list_item.find(".hide-tab").removeClass("d-none")
        }
        hide_list.append(list_item)

        /* Set select list */
        list_item = select_to_clone.clone(false, false)
        list_item.removeClass("d-none")
        list_item.text(tab_name).on("click", _ => {
            $(elem).click()
            $("#nav-tabs-collasped").children().first().children().first().text(tab_name)
            $("#select-tabs").modal("hide")
        })
        select_list.append(list_item)
    })
}

function number_filter(value, min, max) {
    return /^-?\d*$/.test(value) && (value === "" || max == null || isNaN(max) || parseInt(value) <= max)
        && (value === "" || min == null || isNaN(min) || parseInt(value) >= min)
}

$(_ => {
    /* Tooltip initializations */
    $('[data-toggle="tooltip"]').each((i, elem) => {
        if (!elem.getAttribute("hidden") && !$(elem).hasClass("d-none"))
            $(elem).tooltip()
    })
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
