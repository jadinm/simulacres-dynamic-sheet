/**
 * This file handles data saving to the DOM and data importing from another html file
 */

let changed_page = false

/* Remind the user that they need to save the page if they changed anything */
window.onbeforeunload = function () {
    if (changed_page)
        return ""
}

/* Remove duplicated select picker */

$("select[id*='-x-']").selectpicker("destroy")  // Remove hidden select pickers for cloning

$("select.talent-select, select.spell-list").each((i, select) => {
    $(select).parents('.bootstrap-select').first().replaceWith($(select))
})

/* Remove existing summernote */

$(".note-editor.note-frame").remove()

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

    base.find("select").on("changed.bs.select", (e, clickedIndex, newValue, oldValue) => {
        let current_value = $(e.target).selectpicker('val')
        if (!Array.isArray(current_value))
            current_value = [current_value]
        $(e.target).children().each((i, elem) => { // Save results in DOM
            elem.removeAttribute('selected')
            if (current_value.includes(elem.value)) {
                $(e.target).children()[i].setAttribute('selected', 'selected')
            }
        })
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
/* Remove the mdbootstrap button effects if any */
$(".waves-ripple").remove()

/**
 * Update tabs, reset the first tab as the default one
 * @param html the jquery object of the page
 */
function reset_tab_selection(html) {
    html.find("#tabs .tab-pane").removeClass("show").removeClass("active")
    html.find("#status-tab").addClass("show").addClass("active")
    const tab_buttons = html.find("#nav-tabs a")
    tab_buttons.removeClass("active").each((i, elem) => {
        elem.setAttribute("aria-selected", "true")
    })
    tab_buttons.first().addClass("active")[0].setAttribute("aria-selected", "false")
}

/**
 * Overwrite data from input fields, images, select options, radio buttons and sortables of the destination
 * @param src_html source jquery object
 * @param dst_html destination jquery object
 */
function import_data(src_html, dst_html) {
    // Retrieve and copy all of the input values of the src_html
    const table_row_input_id = /(.+)-(\d+)-.+/
    const talent_input_id = /(x|(?:-4)|(?:-2)|0)(\d+)-name/

    src_html.find("input").each((i, old_input) => {
        if (old_input.id && old_input.id.length > 0) {
            const old_input_sel = "#" + old_input.id
            let new_input = dst_html.find(old_input_sel)

            const talent_matching = old_input.id.match(talent_input_id)
            if (new_input.length === 0) {
                let matching = old_input.id.match(table_row_input_id)
                if (matching) {
                    // Add rows to the tables until it finds the appropriate field
                    const button = dst_html.find("#add-" + matching[1])
                    button.trigger("click", parseInt(matching[2])) // Add a new elem with forced index
                    new_input = dst_html.find(old_input_sel)
                }

                if (talent_matching && old_input.value.trim().length > 0) {
                    // Add element
                    const button = dst_html.find("#add-talent-" + talent_matching[1])
                    button.trigger("click", parseInt(talent_matching[2])) // Add a new elem with forced index
                    new_input = dst_html.find(old_input_sel)
                }
            }

            // Check the list of the talent
            if (talent_matching) {
                const target_talent_list = src_html.find(old_input).parents(".talent-list")
                const current_talent_list = dst_html.find(new_input).parents(".talent-list")
                if (target_talent_list.length > 0 && target_talent_list[0].id !== current_talent_list[0].id) {
                    // Move to new table if needed
                    const row = dst_html.find(new_input).parents(".talent")
                    const list = dst_html.find("#" + target_talent_list[0].id)
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

    // Update all text areas
    src_html.find("textarea.summernote").each((i, old_input) => {
        if (old_input.id && old_input.id.length > 0) {
            const old_input_sel = "#" + old_input.id
            let new_input = dst_html.find(old_input_sel)
            new_input.val(src_html.find(old_input).val())

            // Update associated summernote
            new_input.summernote("code", new_input.val())
        }
    })

    // Update all list selections of talents
    dst_html.find("select.talent-select").each((i, elem) => {
        update_talent_select(dst_html.find(elem))
    })

    // Select the correct element in the list
    src_html.find("select").each((i, old_select) => {
        // Find the correct option
        const selection = src_html.find("select#" + old_select.id + " option:selected").map((i, elem) => $(elem).val()).toArray()
        if (selection.length > 0 && !old_select.id.includes("-x-")) {
            // Set this option on the new document
            const new_select = dst_html.find("#" + old_select.id)
            new_select.selectpicker("val", selection)
        }
    })
    dst_html.find(".talent-select.adventure-points-select").trigger("changed.bs.select")
    dst_html.find("select.spell-list").trigger("changed.bs.select")

    // Preserve order of sortable elements
    dst_html.find(".sortable-list").each((i, elem) => {
        const items = dst_html.find(elem).children().sort((a, b) => {
            if (a.id === "") {
                return b.id === "" ? 0 : -1
            } else if (b.id === "") {
                return a.id === "" ? 0 : 1
            }
            const old_a = src_html.find("#" + a.id)
            const old_b = src_html.find("#" + b.id)
            let a_idx = find_index(old_a.parent(), old_a[0])
            let b_idx = find_index(old_b.parent(), old_b[0])
            return a_idx - b_idx
        })
        dst_html.find(elem).append(items)
    })

    // Check correct radio buttons
    src_html.find("input:checked").each((i, old_input) => {
        if (old_input.id && old_input.id.length > 0) { // Avoid summernote inputs
            const new_input = dst_html.find("#" + old_input.id)
            new_input.click().trigger("click")
        }
    })

    // Update the image if any
    const old_image = src_html.find("#character-image")
    if (old_image.length > 0)
        dst_html.find("#character-image")[0].src = old_image[0].src
}

function insert_or_replace_block(block, parent) {
    const block_selector = "#" + block[0].id
    if ($(block_selector).length > 0) {
        $(block).replaceAll(block_selector)
    } else {
        parent.append(block)
    }
}

/**
 * Insert the plugins components (button, tab, css and js) into the page
 * If these components match an existing component, they are replaced
 * @param plugin The jQuery object representing the plugin page
 */
function insert_or_replace_plugins(plugin) {
    const parent_selectors = {
        ".plugin-tab": "#tabs",
        ".plugin-button": "#nav-tabs",
        ".plugin-css": "head",
        ".plugin-js": "body"
    }
    Object.keys(parent_selectors).forEach((selector, _) => {
        // If it is inside another component
        plugin.find(selector).each((i, elem) => insert_or_replace_block($(elem), $(parent_selectors[selector])))
        // If it is an outermost element
        plugin.filter(selector).each((i, elem) => insert_or_replace_block($(elem), $(parent_selectors[selector])))
    })

    // Reset tab selection
    reset_tab_selection($("html"))

    // Add default listeners
    add_save_to_dom_listeners()
}

/* Import Character page data */
$("#import-page").on("change", function (event) {
    if (event.target.files.length === 0)
        return

    const reader = new FileReader()
    reader.onload = e => {
        // Executed at the completion of the read
        const old_html = $(e.target.result)

        // Check that users don't import plugins with the wrong button
        if (old_html.find("#import-page").length === 0)
            alert("Le document n'est pas une fiche de personnage. Si vous essayez d'importer un plugin, utilisez l'autre bouton.")

        import_data(old_html, $("html"))
        reset_tab_selection($("html"))
        insert_or_replace_plugins($(e.target.result))

        event.target.setAttribute("value", "")
        $(event.target).next().text("Importer une ancienne fiche")
    }

    // Asynchronous read
    reader.readAsText(event.target.files[0])
})

/* Import character image */
$("#import-image").on("change", event => {
    if (event.target.files.length === 0)
        return

    const reader = new FileReader()
    reader.onload = _ => {
        // Executed at the completion of the read
        $("#character-image")[0].src = reader.result

        event.target.setAttribute("value", "")
        $(event.target).next().text("Image")
    }
    reader.readAsDataURL(event.target.files[0])
})

/* Import tab */
$("#import-plugin").on("change", event => {
    if (event.target.files.length === 0)
        return

    const reader = new FileReader()
    reader.onload = e => {
        // Executed at the completion of the read
        const plugin = $(e.target.result)

        // Check that users don't import character sheets with the wrong button
        if (plugin.find("#import-page").length > 0)
            alert("Le document n'est pas un plugin. Si vous essayez d'importer une fiche, utilisez l'autre bouton.")

        // Update fields in the tab if it already exists
        let tab = plugin.find(".plugin-tab")
        if (tab.length === 0)
            tab = plugin.filter(".plugin-tab")
        if (tab.length > 0) {
            const current_plugin_version = $("#" + tab[0].id)
            if (current_plugin_version.length > 0) {
                import_data(current_plugin_version, tab)
            }
        }

        // Insert or replace components in the current page
        insert_or_replace_plugins(plugin)

        event.target.setAttribute("value", "")
        $(event.target).next().text("Importer un plugin")
    }

    // Asynchronous read
    reader.readAsText(event.target.files[0])
})
