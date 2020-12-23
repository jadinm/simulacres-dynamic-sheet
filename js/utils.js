/* Data */
const priest_energy = "Divin"

/**
 * Find the index of the child inside the parent based on id
 *
 * @param parent is a jquery object
 * @param child is an element object of parent
 * @returns {number} the index of the child inside the parent
 */
function find_index(parent, child) {

    let idx = 0
    parent.children().each((i, child) => {
        if (child.id === child.id) {
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

function is_dark_mode() {
    return $("#dark-mode").hasClass("d-none")
}

function enable_dark_mode() {
    DarkReader.enable({
        brightness: 100,
        contrast: 100,
        sepia: 0
    })
    $("#dark-mode").addClass("d-none")
    $("#light-mode").removeClass("d-none")
}

function disable_dark_mode() {
    DarkReader.disable()
    $("#light-mode").addClass("d-none")
    $("#dark-mode").removeClass("d-none")
}

$("#light-mode").on("click", _ => {disable_dark_mode()})
$("#dark-mode").on("click", _ => {enable_dark_mode()})

/* Tooltip initializations */
$(_ => {
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
})
