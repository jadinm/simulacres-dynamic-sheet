/**
 * This file handles data saving to the DOM and data importing from another html file
 */

let changed_page = false
const modifiable_sliders = ["hp-head", "hp-trunk", "hp-right-arm", "hp-left-arm", "hp-right-leg", "hp-left-leg",
    "breath", "psychic"]

/* Remind the user that they need to save the page if they changed anything */
window.onbeforeunload = function () {
    if (changed_page)
        return ""
}

/* Remove duplicated select picker */

$("select[id*='-x-']").selectpicker("destroy")  // Remove hidden select pickers for cloning

$("select").each((i, select) => {
    $(select).parents('.bootstrap-select').first().replaceWith($(select))
})

/* Remove existing summernote */

$(".note-editor.note-frame").remove()

/* Update field value attributes as the user writes so that it will be saved in the HTML */

function check_radio(elem) {
    elem.setAttribute("checked", "")
    $(elem).prop("checked", true)
}

function uncheck_checkbox(elem) {
    $(elem).prop("checked", false).removeAttr("checked")
}

function input_change(event) {
    event.target.setAttribute("value", event.target.value)
    changed_page = true
}

function input_slider_change(event) {
    event.target.setAttribute("data-slider-value", event.target.value)
    changed_page = true
}

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
}

function select_change(e) {
    if (e.target.id.includes("-x-"))
        return
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
}

function number_input_key_event() {
    if (number_filter(this.value, this.getAttribute("min"), this.getAttribute("max"))) {
        this.oldValue = this.value
    } else if (this.hasOwnProperty("oldValue")) {
        this.value = this.oldValue
    } else {
        this.value = ""
    }
}

function add_save_to_dom_listeners(base = $(document)) {
    base.find("input").uon("change", input_change)
    base.find("input.input-slider").uon("change", input_slider_change)
    base.find("input[type=\"checkbox\"]").uon("click", checkbox_click)

    base.find("select").uon("changed.bs.select", select_change)

    // Install input filters on number inputs
    base.find("input[type='number']").uon("input keydown keyup mousedown mouseup select contextmenu drop",
        number_input_key_event)
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
 * Show the modal with import warnings
 */
function show_import_warnings(missing_inputs, duplicated_inputs) {
    const list_missing = $("#import-warning-missing")
    list_missing.children().remove()
    $(missing_inputs).each((i, elem) => {
        const value = elem[1] == null ? "" : elem[1]
        list_missing.append($("<li class=\"list-group-item align-items-center py-1 my-0\">\"" + value + "\" dans un champ avec l'identifiant \"" + elem[0] + "\"</li>"))
    })
    const list_duplicated = $("#import-warning-duplicated")
    $(duplicated_inputs).each((i, elem) => {
        list_duplicated.append($("<li class=\"list-group-item align-items-center py-1 my-0\">" + elem + "</li>"))
    })
    $("#import-warning").modal()
}

/**
 * Update tabs, reset the first tab as the default one
 * @param html the jquery object of the page
 */
function reset_tab_selection(html) {
    html.find("#tabs .tab-pane").removeClass("show").removeClass("active")
    html.find("#status-tab").addClass("show").addClass("active")
    const tab_buttons = html.find("#nav-tabs a[role=\"tab\"]")
    tab_buttons.removeClass("active").each((i, elem) => {
        elem.setAttribute("aria-selected", "true")
    })
    tab_buttons.first().addClass("active")[0].setAttribute("aria-selected", "false")
}

/**
 * Overwrite data from input fields, images, select options, radio buttons and sortables of the destination
 * @param src_html source jquery object
 * @param dst_html destination jquery object
 * @param full_sheet whether this is a full sheet update
 */
function import_data(src_html, dst_html, full_sheet) {
    // Retrieve and copy all of the input values of the src_html
    const table_row_input_id = /(.+)-(\d+)-.+/
    const talent_input_id = /^(x|(?:-4)|(?:-2)|0|1)(\d+)-name$/
    const spell_difficulty_input_id = /^(spell-\d+)-(difficulty-input|hermetic-difficulty)$/

    const missing_inputs = []
    const duplicated_inputs = []

    const existing_ids = []
    src_html.find("input").each((i, old_input) => {
        if (old_input.id && old_input.id.length > 0) {
            if (existing_ids.includes(old_input.id) && !old_input.id.includes("plugin-") && !old_input.id.includes("note-dialog-") && !old_input.id.includes("ColorPicker"))
                duplicated_inputs.push(old_input.id)
            else
                existing_ids.push(old_input.id)

            const old_input_sel = "#" + old_input.id
            let new_input = dst_html.find(old_input_sel)

            const talent_matching = old_input.id.match(talent_input_id)
            if (new_input.length === 0) {
                let matching = old_input.id.match(table_row_input_id)
                const difficulty_slider_match = old_input.id.match(spell_difficulty_input_id)
                if (difficulty_slider_match) {
                    // This is an old unified spell difficulty input
                    // => transfer it to the appropriate per-realm spell difficulty
                    const new_spell = $("#" + difficulty_slider_match[1])
                    const old_spell = src_html.find("#" + old_input.id).parents("tr").first()
                    const old_spell_realm = old_spell.find("input[name*=-realm]:checked").first()
                    if (old_spell_realm.length > 0) {
                        const realm_split = old_spell_realm[0].id.split("-")
                        const realm = realm_split[realm_split.length - 1]
                        new_input = row_of(new_spell).get(difficulty_slider_match[2] + "-" + realm)
                    }
                } else if (matching) {
                    // Add rows to the tables until it finds the appropriate field
                    const button = dst_html.find("#add-" + matching[1])
                    const row_selector = "#" + matching[1] + "-" + matching[2]
                    if ($(row_selector).length === 0) {
                        // The row does not exist, so create it
                        button.trigger("click", parseInt(matching[2])) // Add a new elem with forced index
                        new_input = dst_html.find(old_input_sel)
                        if (new_input.length === 0) {
                            // The new created row do not contain the new id,
                            // it is likely that the field was deleted in the new version => we remove the line
                            $(row_selector).remove()
                        }
                    }
                }
            }

            // Check the list of the talent
            const talent_name = old_input.value.trim()
            if (talent_matching && talent_name.length > 0) {
                new_input = talent_from_name(talent_name)
                if (new_input.length === 0) {
                    // Add element
                    const button = dst_html.find("#add-talent-" + talent_matching[1])
                    button.trigger("click")
                    let max_idx = -1
                    let max_id = null
                    $("#talents_" + talent_matching[1]).find("input").each((i, elem) => {
                        const current_idx = talent_index($(elem).parents(".talent")[0])
                        if (current_idx >= max_idx) {
                            max_idx = current_idx
                            max_id = elem.id
                        }
                    })
                    // Just added input
                    new_input = $("#" + max_id)
                }
                if (new_input.length !== 0) {
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
                        // We change the value and trigger the change in case of a listener
                        new_input.val(old_input.value)
                        new_input.trigger("change")

                        update_talent({item: row[0], to: list[0]})
                    } else {
                        // We change the value and trigger the change in case of a listener
                        if (new_input[0].value !== old_input.value) {
                            new_input.val(old_input.value)
                            new_input.trigger("change")
                        }
                    }
                }
            } else {
                // Update the maximum through sliders that can change their maximum: HP/PS/EP
                const old_max = parseInt(old_input.getAttribute("data-slider-max"))
                if (new_input.length > 0 && modifiable_sliders.includes(new_input[0].id) && !isNaN(old_max)) {
                    set_slider_max(new_input, old_max)
                }

                // Refresh modified sliders
                if (new_input.hasClass("input-slider") && !new_input[0].id.includes("-x-")) {
                    new_input.slider("setValue", old_input.value)
                    new_input.slider("refresh", {useCurrentValue: true})
                }

                if (new_input.hasClass("selectpicker") && old_input.getAttribute("type") === "number") {
                    // If the old input is a number input and the new one a list, we select the first options
                    let nbr_options = parseInt(old_input.value)
                    if (isNaN(nbr_options))
                        nbr_options = 0
                    new_input.selectpicker("val",
                        new_input.find("option").slice(0, nbr_options).map((i, elem) => $(elem).val()).toArray())
                    new_input.trigger("change")
                } else if (new_input.length > 0 && old_input.getAttribute("type") === "checkbox") {
                    if (new_input.prop("checked") && old_input.getAttribute("checked") == null || !new_input.prop("checked") && old_input.getAttribute("checked") != null) {
                        new_input.trigger("click")
                        new_input.trigger("change")
                    }
                } else {
                    // We change the value and trigger the change in case of a listener
                    if (new_input.length > 0 && new_input[0].value !== old_input.value
                        || new_input.hasClass("input-slider")) {
                        new_input.val(old_input.value)
                        new_input.trigger("change")
                    }
                }
            }
            if (!(talent_matching && talent_name.length === 0) && new_input.length === 0 && !old_input.id.includes("plugin-") && !old_input.id.includes("note-dialog-") && !old_input.id.includes("ColorPicker")) { // The old input is lost
                missing_inputs.push([old_input.id, old_input.value])
            }
        }
    })

    // Update all text areas
    src_html.find("textarea.summernote").each((i, old_input) => {
        if (old_input.id && old_input.id.length > 0) {
            const old_input_sel = "#" + old_input.id
            let new_input = dst_html.find(old_input_sel)
            let old_value = src_html.find(old_input).val()
            new_input.val(old_value)
            new_input.html(old_value)

            if (new_input.length === 0) { // The old input is lost
                if (!old_input.id.includes("plugin-"))
                    missing_inputs.push([old_input.id, old_input.value])
            } else if (!new_input[0].id.includes("note-")) {
                // Update associated summernote (the editors for the notes are initialized lazily)
                new_input.summernote("code", new_input.val())

                if (existing_ids.includes(old_input.id) && !old_input.id.includes("plugin-"))
                    duplicated_inputs.push(old_input.id)
                else
                    existing_ids.push(old_input.id)
            }
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
    dst_html.find("select").trigger("changed.bs.select")

    // Preserve order of sortable elements
    dst_html.find(".sortable-list").each((i, elem) => {
        const items = dst_html.find(elem).children().sort((a, b) => {
            if (a.id === "") {
                return b.id === "" ? 0 : -1
            } else if (b.id === "") {
                return a.id === "" ? 0 : 1
            }
            let old_a
            let old_b
            if ($(elem).hasClass("talent-list")) {
                // Sorting talents (ids can defer between versions)
                old_a = talent_from_name($(a).find("input").val(), src_html.find("#talent-tab")).parents(".talent")
                old_b = talent_from_name($(b).find("input").val(), src_html.find("#talent-tab")).parents(".talent")
            } else {
                old_a = src_html.find("#" + a.id)
                old_b = src_html.find("#" + b.id)
            }
            const a_idx = find_index(old_a.parent(), old_a[0])
            const b_idx = find_index(old_b.parent(), old_b[0])
            return a_idx - b_idx
        })
        dst_html.find(elem).append(items)
    })

    // Update the image if any
    const old_image = src_html.find("#character-image")
    if (old_image.length > 0 && old_image[0].src && old_image[0].src.length > 0)
        dst_html.find("#character-image")[0].src = old_image[0].src
    const old_background = src_html.filter("#main-container").css("background-image")
    if (old_background)
        dst_html.find("#main-container").css("background-image", old_background)

    // Update all of the roll values
    $(".row-roll-trigger").each((i, elem) => {
        row_of(elem).update_roll_value(elem)
    })

    // Set the same theme
    if (full_sheet) {
        if (is_dark_mode(src_html) && !is_dark_mode()) {
            enable_dark_mode()
        } else if (!is_dark_mode(src_html) && is_dark_mode()) {
            disable_dark_mode()
        }
    }

    // Hide the same sections
    dst_html.find(".hide-section").each((i, elem) => {
        const hide_table = elem.getAttribute("data-hide-table")
        const hide_row = elem.getAttribute("data-hide-row")
        let src_elem = $()
        if (hide_table) {
            src_elem = src_html.find("[data-hide-table=\"" + hide_table + "\"]")
        } else if (hide_row) {
            src_elem = src_html.find("[data-hide-row=\"" + hide_row + "\"]")
        }
        if (src_elem.length > 0
            && (src_elem.hasClass("btn-dark") && $(elem).hasClass("btn-light")
                || src_elem.hasClass("btn-light") && $(elem).hasClass("btn-dark"))) {
            $(elem).click()
        }
    })

    // Hide the same tabs
    src_html.find("#nav-tabs a[role=\"tab\"].d-none").each((i, old_tab) => {
        dst_html.find("#nav-tabs a[role=\"tab\"][href=\"" + old_tab.getAttribute("href") + "\"]").addClass("d-none")
    })

    if (full_sheet && (missing_inputs.length > 0 || duplicated_inputs.length > 0)) {
        show_import_warnings(missing_inputs, duplicated_inputs)
    }
}

const plugin_selectors = [".plugin-tab", ".plugin-button", ".plugin-css", ".plugin-js"]

function query_raw_plugin(url, success_function, error_function) {
    $.get({
        // We only download the plugin for the matching version if any
        url: url,
        method: "GET",
        data: {},
        dataType: "html",
        success: success_function,
        error: error_function,
        timeout: 2000
    })
}

function get_plugin_version(plugin) {
    let version = null
    $(plugin).children().each((i, elem) => {
        const attr = elem.getAttribute("data-plugin-version")
        if (attr)
            version = attr
    })
    return version
}

function is_older_than(version_a, version_b) {
    if (!version_a)
        return true
    if (!version_b)
        return false
    if (version_a === version_b)
        return false
    const split_a = version_a.split(".")
    const split_b = version_b.split(".")
    for (let i = 0; i < split_a.length && i < split_b.length; i++) {
        const part_a = parseInt(split_a[i])
        const part_b = parseInt(split_b[i])
        if (part_a > part_b)
            return false
        if (part_a < part_b)
            return true
    }
    // This is a new version only if b has a more specified version
    // e.g., a == "1.0" and b == "1.0.1"
    return split_a.length < split_b.length
}

function build_plugin_list() {
    const plugin_list = $("#about-sheet-plugins")

    // Clean current list
    plugin_list.children().not(".d-none").remove()

    // Get the list of plugin ids
    let plugins = []
    let plugin_versions = {}
    $(plugin_selectors.join(", ")).each((i, elem) => {
        let plugin_id = elem.getAttribute("data-plugin-id")
        if (!plugin_id || plugin_id.length === 0) {
            plugin_id = elem.id.match(/plugin-(?:tab|button|css|js)-(.+)/)
            if (plugin_id && plugin_id.length >= 1)
                plugin_id = plugin_id[1]
        }
        if (plugin_id && plugin_id.length >= 1) {
            if (!plugins.includes(plugin_id))
                plugins.push(plugin_id)
            const version = elem.getAttribute("data-plugin-version")
            if (version)
                plugin_versions[plugin_id] = version
        }
    })
    plugins = plugins.reverse()

    // Build the list of plugins
    const template = plugin_list.children().first()
    for (let i = 0; i < plugins.length; i++) {
        const new_element = template.clone(true, true)
        new_element.removeClass("d-none").addClass("d-flex")
        new_element.children().first().text(plugins[i])
        const upgrade = new_element.find(".plugin-update")
        const url = "https://raw.githubusercontent.com/jadinm/simulacres-dynamic-sheet/" + latest_released_version + "/plugins/plugin_" + plugins[i].replaceAll("-", "_") + ".html"
        query_raw_plugin(url, (data) => {
            const remote_version = get_plugin_version($(data))
            if (is_older_than(plugin_versions[plugins[i]], remote_version)) {
                // Have a candidate for upgrade
                upgrade.removeClass("invisible")
            } else {
                upgrade.addClass("invisible")
            }
        }, () => { // No matching plugin
            upgrade.addClass("invisible")
        })
        upgrade.on("click", _ => {
            query_raw_plugin(url, (data) => {
                const plugin = $(data)
                let tab = plugin.find(".plugin-tab")
                if (tab.length === 0)
                    tab = plugin.filter(".plugin-tab")
                if (tab.length > 0) {
                    const current_plugin_version = $("#" + tab[0].id)
                    if (current_plugin_version.length > 0) {
                        import_data(current_plugin_version, tab, false)
                    }
                }

                insert_or_replace_plugins(plugin) // Upgrade plugin
                upgrade.removeClass("invisible")
            }, () => {
                upgrade.addClass("invisible")
            })
        })
        plugin_list.append(new_element)
    }

    // Show the list if any plugin remains
    if (plugin_list.children().length > 1)
        $(".hide-without-plugin").removeClass("d-none")
    else
        $(".hide-without-plugin").addClass("d-none")
}

function insert_or_replace_block(block, parent, overwrite = true) {
    const block_selector = "#" + block[0].id
    if ($(block_selector).length > 0) {
        if (overwrite)
            $(block).replaceAll(block_selector)
    } else {
        let last_child = null
        if (parent[0].id === "nav-tabs") { // Keep setting button last
            last_child = parent.children().last()
        }
        parent.append(block)
        if (last_child) {
            parent.append(last_child)
        }
    }
}

/**
 * Insert the plugins components (button, tab, css and js) into the page
 * If these components match an existing component, they are replaced
 * @param plugin The jQuery object representing the plugin page
 * @param overwrite whether existing plugin blocks are updated or not
 */
function insert_or_replace_plugins(plugin, overwrite = true) {
    const parent_selectors = {
        ".plugin-tab": "#tabs",
        ".plugin-button": "#nav-tabs",
        ".plugin-css": "head",
        ".plugin-js": "body"
    }
    Object.keys(parent_selectors).forEach((selector, _) => {
        // If it is inside another component
        plugin.find(selector).each((i, elem) => insert_or_replace_block($(elem), $(parent_selectors[selector]), overwrite))
        // If it is an outermost element
        plugin.filter(selector).each((i, elem) => insert_or_replace_block($(elem), $(parent_selectors[selector]), overwrite))
    })

    // Reset tab selection
    reset_tab_selection($("html"))

    // Add default listeners
    add_save_to_dom_listeners()

    // Update plugin list
    build_plugin_list()

    // Update tab list
    build_tab_hide_list()
}

const plugin_dispose_methods = {}

function remove_plugin(plugin_id) {
    // Remove blocks related to this plugin
    for (let i = 0; i < plugin_selectors.length; i++) {
        $("[id*=\"" + plugin_selectors[i].slice(1) + "-" + plugin_id + "\"]").remove()
        $("[data-plugin-id*=\"" + plugin_id + "\"]").remove()
    }
    // Call the dispose method of the plugin if any
    if (plugin_id in plugin_dispose_methods) {
        plugin_dispose_methods[plugin_id]()
        delete plugin_dispose_methods[plugin_id]
    }
    // Update plugin list
    build_plugin_list()
    // Update list of tabs
    build_tab_hide_list()
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

        import_data(old_html, $("html"), true)
        reset_tab_selection($("html"))
        // We insert new plugins from the old character sheet
        // but we keep the current version of existing plugins
        insert_or_replace_plugins($(e.target.result), false)

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

$("#image-remove").on("click", _ => {
    $("#character-image").removeAttr("src")
})

/* Import character image */
$("#import-background-image").on("change", event => {
    if (event.target.files.length === 0)
        return

    const reader = new FileReader()
    reader.onload = _ => {
        // Executed at the completion of the read
        $("#main-container").css("background-image", "url(\"" + reader.result + "\")")

        event.target.setAttribute("value", "")
        $(event.target).next().text("Image de fond")
    }
    reader.readAsDataURL(event.target.files[0])
})

$("#background-image-remove").on("click", _ => {
    $("#main-container").css("background-image", "none")
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
                import_data(current_plugin_version, tab, false)
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

$(_ => {
    // Plugin handling
    $(".plugin-remove").on("click", event => {
        const plugin_id = $(event.target).parent().children().first().text()
        remove_plugin(plugin_id)
    })
    build_plugin_list()
})
