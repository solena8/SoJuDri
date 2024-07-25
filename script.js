// Fonction pour récupérer des données à partir de l'API
window.getData = async function (url) {
    try {
        const response = await fetch(url); // Effectue une requête pour obtenir les données de l'API
        if (!response.ok) {
            // Vérifie si la réponse est correcte
            throw new Error(`Response status: ${response.status}`); // Lance une erreur si la réponse n'est pas correcte
        }
        const json = await response.json(); // Parse le JSON obtenu de l'API

        const countriesData = []; // Initialise un tableau pour contenir les objets des pays avec les informations nécessaires
        for (const country of json) {
            // Parcourt chaque pays dans les données JSON
            // Récupère les informations nécessaires du pays et les place dans un nouvel objet
            const countryData = {
                name: country.name?.common, // Nom commun du pays
                population: country.population, // Population du pays
                value: country.gini ? Object.values(country.gini)[0] : "N/A", // Renomme gini en value et prend la première valeur de l'objet gini ou "N/A" si elle n'existe pas
            };
            countriesData.push(countryData); // Ajoute l'objet du pays au tableau
        }
        console.log(countriesData)
        return countriesData; // Retourne le tableau des pays
    } catch (error) {
        console.error(error.message); // Affiche l'erreur dans la console
        return []; // Retourne un tableau vide en cas d'erreur
    }
};

// Fonction pour assigner une couleur basée sur l'indice GINI, en prenant un pays en paramètre
window.getColor = function (country) {
    const value = country.value;
    if (value === "N/A") {
        return "gray"; // Retourne gris si le pays n'a pas d'indice GINI enregistré
    } else if (value > 60) {
        return "#1a3685";
    } else if (value > 55) {
        return "#2157a3";
    } else if (value > 50) {
        return "#237eb6";
    } else if (value > 45) {
        return "#35a3c0";
    } else if (value > 40) {
        return "#5fbfbf";
    } else if (value > 35) {
        return "#96d6b9";
    } else if (value > 30) {
        return "#c8eab6";
    } else {
        return "#eaf7be";
    }
};

// Fonction pour afficher une infobulle (tooltip)
function showTooltip(event, country) {
    const tooltip = document.createElement("div");
    tooltip.classList.add("tooltip");
    tooltip.innerHTML = `
        <strong>${country.name}</strong><br>
        Population: ${country.population.toLocaleString()}<br>
        Gini: ${country.value}
    `;
    document.body.appendChild(tooltip);

    // Fonction pour déplacer l'infobulle en fonction de la position de la souris
    function moveTooltip(e) {
        tooltip.style.left = e.pageX + 10 + "px"; 
        tooltip.style.top = e.pageY + 10 + "px"; 
    }

    function removeTooltip() {
        document.body.removeChild(tooltip); // Supprime l'infobulle du DOM
        event.target.removeEventListener("mousemove", moveTooltip); 
        event.target.removeEventListener("mouseout", removeTooltip); 
    }

    event.target.addEventListener("mousemove", moveTooltip); 
    event.target.addEventListener("mouseout", removeTooltip); 
    //la souris quitte l'élément
}

async function createMapWithData(apiUrl) {
    const countries = await getData(apiUrl); // Récupère les données des pays depuis l'URL API

    if (Array.isArray(countries) && countries.length > 0) {
        // Vérifie que les données sont bien un tableau et qu'il n'est pas vide

        countries.forEach((country) => {
            const path = document.querySelector(
                `path[title="${country.name}"]`
            );
            if (path) {
                // Trouve le chemin SVG correspondant au nom du pays et applique une couleur basée sur l'indice GINI
                path.style.fill = getColor(country);
                path.addEventListener("mouseover", function (event) {
                    showTooltip(event, country); // Affiche l'infobulle lors du survol
                });
            } else {
                console.error(`Country ${country.name} not found on the map.`); // Affiche une erreur si le pays n'est pas trouvé
            }
        });
    } else {
        console.error(
            "No countries data available or the data format is incorrect."
        ); // Affiche une erreur si les données sont incorrectes ou vides
    }
}

const mobileNav = document.querySelector(".hamburger");
const navbar = document.querySelector(".menubar");

const toggleNav = () => {
    navbar.classList.toggle("active"); // Active/désactive la classe 'active' sur la barre de navigation
    mobileNav.classList.toggle("hamburger-active"); // Active/désactive la classe 'hamburger-active' sur le bouton de menu
};
mobileNav.addEventListener("click", () => toggleNav()); // Ajoute un écouteur de clic pour basculer le menu

// Fonction pour créer une carte TreeMap avec des données
window.createTreeMap = async function (url) {
    const apiUrl = url;
    const countries = await getData(apiUrl); // Récupère les données depuis l'URL de l'API

    // Trier les pays par valeur en ordre décroissant, en gérant correctement les 'N/A'
    countries.sort((a, b) => {
        if (a.value === "N/A") return 1; // Place 'N/A' à la fin
        if (b.value === "N/A") return -1; // Place 'N/A' à la fin
        return b.value - a.value; // Trie par valeur décroissante
    });

    // Encapsuler les données dans le format hiérarchique attendu par la Treemap
    const data = {
        name: "Countries",
        children: countries, // Utilise les données triées directement
    };

    var root = am5.Root.new("chartdiv"); // Crée une nouvelle racine pour le graphique

    root.setThemes([am5themes_Animated.new(root)]); // Applique le thème animé

    var container = root.container.children.push(
        am5.Container.new(root, {
            width: am5.percent(100), // Définit la largeur à 100%
            height: am5.percent(100), // Définit la hauteur à 100%
            layout: root.verticalLayout, // Utilise une disposition verticale
        })
    );

    var series = container.children.push(
        am5hierarchy.Treemap.new(root, {
            singleBranchOnly: false, // Permet plusieurs branches
            downDepth: 1,
            upDepth: -1,
            initialDepth: 2,
            valueField: "value", // Utilise le champ 'value' pour la taille
            categoryField: "name", // Utilise le champ 'name' pour la catégorie
            childDataField: "children", // Utilise le champ 'children' pour les enfants
            nodePaddingOuter: 0,
            nodePaddingInner: 0,
        })
    );

    // Appliquer la couleur en fonction de la valeur en utilisant la fonction globale getColor
    series.rectangles.template.adapters.add("fill", function (fill, target) {
        return window.getColor(target.dataItem.dataContext); // Adapte la couleur en fonction du contexte des données
    });

    var tooltip = am5.Tooltip.new(root, {
        getFillFromSprite: false, // Ne pas obtenir le remplissage à partir du sprite
        labelText: "[bold]{name}[/]\nPopulation: {population}\nValue: {value}", // Texte du tooltip
    });

    tooltip.get("background").setAll({
        fill: am5.color(0xffffff), // Remplit l'arrière-plan du tooltip en blanc
        fillOpacity: 1, // Opacité de remplissage à 100%
    });

    series.set("tooltip", tooltip); // Associe le tooltip à la série

    // Configurer les styles des étiquettes
    series.labels.template.setAll({
        fill: am5.color(0x000000),
        fontSize: "0.75em",
        textAlign: "middle",
        textBaseline: "middle",
    });

    // Définir les données à la série
    series.data.setAll([data]); // Associe les données hiérarchiques à la série
    series.set("selectedDataItem", series.dataItems[0]); // Sélectionne le premier élément de données

    series.appear(1000, 100); // Applique une animation d'apparition
};
