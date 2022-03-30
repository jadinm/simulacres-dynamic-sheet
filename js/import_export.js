/**
 * This file handles data saving to the DOM and data importing from another html file
 */

let changed_page = false

/* Remind the user that they need to save the page if they changed anything */
window.onbeforeunload = function () {
    if (changed_page) {
        return ""
    }
}

/* Remove duplicated select picker */

$("select[id*='-x-']").selectpicker("destroy")  // Remove hidden select pickers for cloning

$("select").each((i, select) => {
    $(select).parents('.bootstrap-select').first().replaceWith($(select))
})

/* Remove existing summernote */

$(".note-editor.note-frame").remove()

function save_page() {
    // Save data to DOM
    sheet.save()

    const userInput = "<!DOCTYPE html><html lang=\"fr\">" + $("html").html() + "</html>"
    const blob = new Blob([userInput], {type: "text/html;charset=utf-8"})

    // Use the name of the character as the name of the file
    let character_name = $("input#character-name")
    if (character_name.length === 0)
        character_name = "NPC Grid"
    else {
        character_name = character_name[0].value
        if (character_name === null || character_name.length === 0)
            character_name = "Anonyme"
    }
    saveAs(blob, character_name + ".html")

    changed_page = false
}

/* Save Character page */
$("#save-page").on("click", function () {
    save_page()
})
/* Remove the mdbootstrap button effects if any */
$(".waves-ripple").remove()

/**
 * Update tabs, reset the first tab as the default one
 * @param html the jquery object of the page
 */
function reset_tab_selection(html) {
    if (html.find("#tabs").length === 0)
        return
    const tabs = html.find("#tabs .tab-pane");
    tabs.removeClass("show").removeClass("active")
    tabs.first().addClass("show").addClass("active")
    const tab_buttons = html.find("#nav-tabs a[role=\"tab\"]")
    tab_buttons.removeClass("active").each((i, elem) => {
        elem.setAttribute("aria-selected", "true")
    })
    tab_buttons.first().addClass("active")[0].setAttribute("aria-selected", "false")
    // Reset it also for the collapsed navbar
    navbar_collapsing()
}

/**
 * Overwrite data from input fields, images, select options, radio buttons and sortables of the destination
 * @param src_html source jquery object
 */
function import_data(src_html) {
    logger.info("Extracting data from old sheet")
    const old_sheet = new Character(src_html)
    old_sheet.build()

    logger.info("Importing data from old sheet")
    sheet.import(old_sheet.export(), true)

    // Update the image if any
    logger.info("Updating image")
    const old_image = src_html.find("#character-image")
    if (old_image.length > 0 && old_image[0].src && old_image[0].src.length > 0)
        $("#character-image")[0].src = old_image[0].src
    const old_background = src_html.filter("#main-container").css("background-image")
    if (old_background)
        $("#main-container").css("background-image", old_background)

    // Set the same theme
    logger.info("Setting the same theme")
    if (is_dark_mode(src_html) && !is_dark_mode()) {
        enable_dark_mode()
    } else if (!is_dark_mode(src_html) && is_dark_mode()) {
        disable_dark_mode()
    }

    logger.info("Showing the same sections")

    // Hide the same sections
    $(".hide-section").each((i, elem) => {
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
        $("#nav-tabs a[role=\"tab\"][href=\"" + old_tab.getAttribute("href") + "\"]").addClass("d-none")
    })

    // Have the same name for all of the tabs
    src_html.find("#nav-tabs a[role=\"tab\"]").each((i, old_tab) => {
        $("#nav-tabs a[role=\"tab\"][href=\"" + old_tab.getAttribute("href") + "\"]").text($(old_tab).text().trim())
    })
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
        new_element.children().first().text(plugins[i] + " (version " + plugin_versions[plugins[i]] + ")")
        const upgrade = new_element.find(".plugin-update")
        const url = "https://raw.githubusercontent.com/jadinm/simulacres-dynamic-sheet/" + latest_released_version + "/plugins/plugin_" + plugins[i].replaceAll("-", "_") + ".html"
        query_raw_plugin(url, (data) => {
            const remote_version = PluginModel.get_plugin_version($(data))
            if (PluginModel.is_older_than(plugin_versions[plugins[i]], remote_version)) {
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
        let last_children = $()
        if (parent[0].id === "nav-tabs") { // Keep setting buttons last
            last_children = parent.children().filter(".tab-left")
        }
        parent.append(block)
        last_children.each((i, elem) => parent.append($(elem)))
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

    // Update plugin list
    build_plugin_list()

    // Update tab list
    build_tab_hide_list()
}

function remove_plugin(plugin_id) {
    // Remove blocks related to this plugin
    for (let i = 0; i < plugin_selectors.length; i++) {
        $("[id*=\"plugin-" + plugin_selectors[i].slice(1) + "-" + plugin_id + "\"]").remove()
        $("[data-plugin-id*=\"" + plugin_id + "\"]").remove()
    }
    // Call the dispose method of the plugin if any
    plugin_id = "plugin-" + plugin_id
    if (sheet && plugin_id in sheet) {
        sheet[plugin_id].remove()
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
        const startTime = performance.now()
        // Executed at the completion of the read
        const old_html = $(e.target.result)

        // Check that users don't import plugins with the wrong button
        if (old_html.find("#import-page").length === 0)
            alert("Le document n'est pas une fiche de personnage. Si vous essayez d'importer un plugin, utilisez l'autre bouton.")
        else {
            // When importing and enabling a tooltip, they stick around in the saved page and are impossible to remove
            // without using the HTML inspector. So we remove them during the import process
            const tooltips = $('[data-toggle="tooltip"]')
            tooltips.tooltip("dispose")

            // We insert new plugins from the old character sheet
            // but we keep the current version of existing plugins
            insert_or_replace_plugins($(e.target.result), false)

            import_data(old_html)
            reset_tab_selection($("html"))

            event.target.setAttribute("value", "")
            $(event.target).next().text("Importer une ancienne fiche")
            const endTime = performance.now()
            logger.info(`Importing the page took ${endTime - startTime} milliseconds`)

            if (sheet.has_errors()) { // No automatic saving if there are import errors
                sheet.build_import_error_summary()
            } else {
                logger.info("Saving page")
                $("#save-page").click()
            }
            tooltips.tooltip()
        }
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
        else {
            // Insert or replace components in the current page
            // Note: this will trigger import automatically if the PluginModel is loaded in the imported js
            insert_or_replace_plugins(plugin)
        }

        event.target.setAttribute("value", "")
        $(event.target).next().text("Importer un plugin")
    }

    // Asynchronous read
    reader.readAsText(event.target.files[0])
})

$(_ => {
    // Plugin handling
    $(".plugin-remove").on("click", event => {
        const plugin_id = $(event.target).parent().children().first().text().split(" (version ")[0]
        remove_plugin(plugin_id)
    })
    build_plugin_list()
})
