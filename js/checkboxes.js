function check_radio(elem) {
    elem.setAttribute("checked", "")
    $(elem).prop("checked", true)
}

function uncheck_checkbox(elem) {
    $(elem).prop("checked", false).removeAttr("checked")
}

/**
 * Returns true iff the radio is now checked
 */
function checkbox_click(event) {
    const already_present = $(event.target).is(':checked')
    if ($(event.target).parents(".custom-control").first().hasClass("custom-radio")) {
        // Uncheck previous selection if we want to emulate radio buttons
        $("input[name='" + event.target.name + "']").prop("checked", false).removeAttr("checked")
    }

    if (already_present) { // Do not check if the same element was selected twice
        check_radio(event.target)
    } else {
        uncheck_checkbox(event.target)
    }
    changed_page = true
    return already_present
}
