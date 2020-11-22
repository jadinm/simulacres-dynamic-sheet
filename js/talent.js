/* This file handles the talent lists */

regex_talent_from_id = /talent_(x|(?:-4)|(?:-2)|0)\d*/

function talent_level(talent, target_list = null) {
    const list = (target_list) ? target_list : $(talent).parents(".talent-list")[0]
    return list.id.replace("talents_", "")
}

function talent_base_level(talent) {
    return talent.id.match(regex_talent_from_id)[1]
}

function add_talent(list, fixed_id = null) {
    const initial_level = list[0].id.replace("talents_", "")

    // Find new id
    let new_id_idx = 0
    if (fixed_id === null) {
        while ($("#talent_" + initial_level + new_id_idx).length > 0)
            new_id_idx++
    } else {
        new_id_idx = fixed_id
    }

    // Clone and set ids
    const new_talent = $("#talent_" + initial_level).clone(true, true)
    new_talent[0].id = "talent_" + initial_level + new_id_idx
    const input = $(new_talent).find("input")
    input[0].id = initial_level + new_id_idx + "-name"
    input[0].value = ""
    input[0].setAttribute("value", "")
    const label = $(new_talent).find("label")[0]
    label.for = initial_level + new_id_idx + "-name"
    $(new_talent).removeAttr("hidden")
    $(new_talent).tooltip()

    list.children().last().before(new_talent)

    // Update all list selections of talents
    $("select.talent-select").each((i, elem) => {
        update_talent_select($(elem))
    })
    // Update rolls
    $(".roll-value").each((i, elem) => {
        update_roll_value($(elem))
    })
    return new_talent
}

$("#add-talent-x").on("click", (event, idx = null) => { // Add parameter to fix the id
    add_talent($("#talents_x"), idx)
})
$("#add-talent--4").on("click", (event, idx = null) => { // Add parameter to fix the id
    add_talent($("#talents_-4"), idx)
})
$("#add-talent--2").on("click", (event, idx = null) => { // Add parameter to fix the id
    add_talent($("#talents_-2"), idx)
})
$("#add-talent-0").on("click", (event, idx = null) => { // Add parameter to fix the id
    add_talent($("#talents_0"), idx)
})

default_talents = {
    x: ["Agriculture", "Alchimie", "Art de la guerre", "Art magique", "Botanique", "Histoire d'Heldor",
        "Langue étrangère éloignée", "Lire & Écrire", "Lire sur les lèvres", "Mathématiques", "Navigation",
        "Menuiserie/Ébénisterie", "Minéralogie/Joaillerie", "Poisons", "Serrurerie", "Zoologie"],
    "-4": ["Armes normales", "Arts martiaux/Lutte", "Camouflage", "Commerce/Marchandage", "Coutumes étrangères",
        "Équitation", "Géographie d'Heldor", "Langue étrangère proche", "Jonglage/Acrobaties", "Maçonnerie",
        "Médecine", "Musique", "Natation", "Piégeage", "Vol à la tire"],
    "-2": ["Armes légères", "Bricolage", "Cartographie", "Comédie", "Danse", "Déguisement", "Dessin", "Dressage",
        "Escalade", "Orientation", "Poésie/Contes & Légendes", "Pistage/Chasse/Pêche", "Premiers soins",
        "Recherches en bibliothèque", "Religion", "Sculpture"],
    "0": ["Athlétisme", "Bagarre", "Chant", "Cuisine", "Discrétion", "Entregent", "Langue maternelle", "Séduction",
        "Observation"]
}

function add_missing_talents(talents) {
    // Insert missing default talent if they do not exist
    for (const [level, level_talents] of Object.entries(talents)) {
        for (const talent of level_talents) {
            if ($("input[value=\"" + talent + "\"]").length === 0) {
                const elem = add_talent($("#talents_" + level)).find("input")
                elem.val(talent)
                elem.trigger("change")
            }
        }
    }
}

add_missing_talents(default_talents)

function update_talent(event) {
    const target_list = event.to
    const current_level = talent_level(event.item, target_list)
    const old_level = talent_base_level(event.item)

    // Update tooltip and color for increased talents
    if (current_level !== old_level) {
        event.item.setAttribute("data-original-title",
            "Talent " + old_level.toUpperCase() + " à la base <br />" + "Coût: "
            + talent_increment_cost[old_level][current_level] + " PA")
        $(event.item).addClass("increased-talent").tooltip({disabled: false})
        $(event.item).find(".talent-origin").text("< " + old_level.toUpperCase())
    } else {
        event.item.setAttribute("data-original-title", "")
        $(event.item).removeClass("increased-talent").tooltip({disabled: true})
        $(event.item).find(".talent-origin").text("")
    }

    // Update rolls
    $(".roll-value").each((i, elem) => {
        update_roll_value($(elem))
    })

    // Update Adventure points
    compute_remaining_ap()

    changed_page = true
}

$(".talent input[id*='-name']").on("click", _ => {
    // Update all list selections of talents
    $("select.talent-select").each((i, elem) => {
        update_talent_select($(elem))
    })
})

$('.talent-list').sortable({
    handle: '.fa-arrows-alt',
    group: 'talent-lists',
    dragoverBubble: true,
    onEnd: update_talent
})

$("select.talent-select").on("changed.bs.select", talent_changed).each((i, elem) => {
    if (elem.id !== "roll-x-talent")
        update_talent_select($(elem))
    changed_page = false // Because this is not changed by the user
})

$('.remove-talent').sortable({
    group: 'talent-lists', // So that it can delete those items
    ghostClass: "remove-drop",
    onAdd: event => {
        // Remove the element
        $(event.item).remove()

        // Update rolls
        $(".roll-value").each((i, elem) => {
            update_roll_value($(elem))
        })

        changed_page = true
    }
})
