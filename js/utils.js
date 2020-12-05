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

// Set the right version of bootstrap for bootstrap-select
$.fn.selectpicker.Constructor.BootstrapVersion = '4';

/* Tooltip initializations */
$(_ => {
    $('[data-toggle="tooltip"]:visible').tooltip()
    $('button[data-toggle="tooltip"]').tooltip()
})
