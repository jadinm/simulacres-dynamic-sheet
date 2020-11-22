/**
 * This file handles data saving to the DOM and data importing from another html file
 */

let changed_page = false

/* Remind the user that they need to save the page if they changed anything */
window.onbeforeunload = function() {
    if (changed_page)
        return ""
}

/* Remove duplicated select picker */

$("select.talent-select").each((i, select) => {
    $(select).parents('.bootstrap-select').first().replaceWith($(select))
})

/* Update field value attributes as the user writes so that it will be saved in the HTML */

function add_save_to_dom_listeners(base = $(document)) {

    base.find("input").on("change", event => {
        event.target.setAttribute("value", event.target.value)
        changed_page = true
    })
    base.find("input.input-slider").on("change", event => {
        event.target.setAttribute("data-slider-value", event.target.value)
        changed_page = true
    })
    base.find("input[type=\"radio\"]").on("click", event => {
        $("input[name='" + event.target.name + "']").removeAttr("checked")
        event.target.setAttribute("checked", "")
        changed_page = true
    })
}

add_save_to_dom_listeners()

/* Save Character page */
$("#save-page").on("click", function (_) {
    const userInput = "<!DOCTYPE html><html lang=\"fr\">" + $("html").html() + "</html>"
    const blob = new Blob([userInput], {type: "text/html;charset=utf-8"})

    // Use the name of the character as the name of the file
    let character_name = $("input#character-name")[0].value
    if (character_name === null || character_name.length === 0)
        character_name = "Anonyme"
    saveAs(blob, character_name + ".html")

    changed_page = false
})

/* Import Character page data */
$("#import-page").on("change", function (event) {
    if (event.target.files.length === 0)
        return

    const reader = new FileReader();
    reader.onload = e => {
        // Executed at the completion of the read
        const old_html = $(e.target.result)

        // Retrieve and copy all of the input values of the old_html
        const table_row_input_id = /(.+)-(\d+)-.+/;
        const talent_input_id = /(x|(?:-4)|(?:-2)|0)(\d+)-name/;
        old_html.find("input").each((i, old_input) => {
            if (old_input.id && old_input.id.length > 0) {
                const old_input_sel = "#" + old_input.id
                let new_input = $(old_input_sel)

                const talent_matching = old_input.id.match(talent_input_id);
                if (new_input.length === 0) {
                    let matching = old_input.id.match(table_row_input_id)
                    if (matching) {
                        // Add rows to the tables until it finds the appropriate field
                        const button = $("#add-" + matching[1])
                        button.trigger("click", parseInt(matching[2])) // Add a new elem with forced index
                        new_input = $(old_input_sel)
                    }

                    if (talent_matching && old_input.value.trim().length > 0) {
                        // Add element
                        const button = $("#add-talent-" + talent_matching[1])
                        button.trigger("click", parseInt(talent_matching[2])) // Add a new elem with forced index
                        new_input = $(old_input_sel)
                    }
                }

                // Check the list of the talent
                if (talent_matching) {
                    const target_talent_list = old_html.find(old_input).parents(".talent-list")
                    const current_talent_list = $(new_input).parents(".talent-list")
                    if (target_talent_list.length > 0 && target_talent_list[0].id !== current_talent_list[0].id) {
                        // Move to new table if needed
                        const row = $(new_input).parents(".talent")
                        const list = $("#" + target_talent_list[0].id)
                        const header = list.children().first()
                        const last_orig_moved = list.find(".talent-origin:not(:empty)").last()
                        if (last_orig_moved.length > 0) { // Insert after last moved item (to preserve the order)
                            last_orig_moved.parents(".talent").after(row)
                        } else {
                            header.after(row)
                        }
                        update_talent({item: row[0], to: list[0]})
                    }
                }

                // Refresh modified sliders
                if (new_input.hasClass("input-slider") && !new_input[0].id.includes("-x-")) {
                    new_input.slider("setValue", old_input.value)
                    new_input.slider("refresh", {useCurrentValue: true})
                }

                // We change the value and trigger the change in case of a listener
                new_input.val(old_input.value)
                new_input.trigger("change")
            }
        })

        old_html.find("select").each((i, old_select) => {
            // Find the correct option
            const selection = old_html.find("select#" + old_select.id + " option:selected")
            if (selection.length > 0) {
                // Set this option on the new document
                const new_select = $("#" + old_select.id)
                new_select.children().each((j, option) => {
                    option.removeAttribute("selected")
                    if (option.value === selection[0].value) {
                        option.setAttribute("selected", "selected")
                    }
                })
                new_select.selectpicker("refresh")
            }
        })

        // Preserve order of sortable elements
        $(".sortable-list").each((i, elem) => {
            const items = $(elem).children().sort((a, b) => {
                if (a.id === "") {
                    return b.id === "" ? 0 : -1
                } else if (b.id === "") {
                    return a.id === "" ? 0 : 1
                }
                const old_a = old_html.find("#" + a.id)
                const old_b = old_html.find("#" + b.id)
                let a_idx = find_index(old_a.parent(), old_a[0])
                let b_idx = find_index(old_b.parent(), old_b[0])
                return a_idx - b_idx
            })
            $(elem).append(items)
        })

        // Check correct radio buttons
        old_html.find("input:checked").each((i, old_input) => {
            const new_input = $("#" + old_input.id)
            new_input.click().trigger("click")
        })
    }

    // Asynchronous read
    reader.readAsText(event.target.files[0])
})
