/*
1. Get recipe data using GET endpoint (Extract recipe from Website)
2. Analyze recipe data using POST endpoint (Analyze recipe)
3. Parse RFN response into Notion Format
    3a. Get Ingredients and Instructions from the first response
    3b. Get nutrition info from the second response
4. Generate Nutrition Label based on analyzed data
    https://github.com/nutritionix/nutrition-label
    https://stackoverflow.com/questions/53757970/downloading-data-tables-from-html-as-image
    RFN API (no support for website recipes right now)
5. Send formatted data and nutrition label to Notion
*/

// const axios = require("axios");
// const dotenv = require("dotenv").config();
// const fs = require("fs");
// const prompt = require("prompt-sync")({sigint: true});

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import promptSync  from 'prompt-sync'
const prompt = promptSync({sigint: true})

import path from 'path';
import { fileURLToPath } from 'url'

const nodePath = path.resolve(process.argv[1]);
const modulePath = path.resolve(fileURLToPath(import.meta.url))
const isRunningDirectlyViaCLI = nodePath === modulePath

import { createRequire } from 'module';
const require = createRequire(import.meta.url);


// Text processing
function cleanString(string, keep_commas=true) {

    if (string) {
        // Convert the string to a list of characters.
        const characters = string.split('');

        // Create a new string to store the filtered characters.
        let filteredString = '';

        // Iterate through the characters and add only the alphabet ASCII characters, whitespaces, and common punctuation to the filtered string.
        for (const character of characters) {
            if (/[\w ,.!?'-½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]/.test(character)) {
                if (character === ',') {
                    if (keep_commas) {
                        filteredString += character;
                    } else {
                        filteredString += ' /';
                    }
                } else {
                    filteredString += character;
                }
            }
        }

        // console.log(`${typeof string} "${string}" --> ${trimWhitespace(filteredString)}`);

        // Return the filtered string.
        return trimWhitespace(filteredString);
    } else {
        return "";
    }
}
function trimWhitespace(string) {
    // Remove leading and trailing whitespace.
    string = string.trim();
  
    // Remove any sequences of consecutive whitespace characters.
    string = string.replace(/\s+/g, " ");
  
    return string;
}
function titleCase(str) {
    // Step 1. Lowercase the string
    str = str.toLowerCase() // str = "i'm a little tea pot";
    
    // Step 2. Split the string into an array of strings
    str = str.split(' ') // str = ["i'm", "a", "little", "tea", "pot"];
           
    // Step 3. Map over the array
    str = str.map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
      /* Map process
      1st word: "i'm"    => (word.charAt(0).toUpperCase() + word.slice(1));
                            "i'm".charAt(0).toUpperCase() + "i'm".slice(1);
                                  "I"                     +     "'m";
                            return "I'm";
      2nd word: "a"      => (word.charAt(0).toUpperCase() + word.slice(1));
                            "a".charAt(0).toUpperCase()   + "".slice(1);
                                  "A"                     +     "";
                            return "A";
      3rd word: "little" => (word.charAt(0).toUpperCase()    + word.slice(1));
                            "little".charAt(0).toUpperCase() + "little".slice(1);
                                  "L"                        +     "ittle";
                            return "Little";
      4th word: "tea"    => (word.charAt(0).toUpperCase() + word.slice(1));
                            "tea".charAt(0).toUpperCase() + "tea".slice(1);
                                  "T"                     +     "ea";
                            return "Tea";
      5th word: "pot"    => (word.charAt(0).toUpperCase() + word.slice(1));
                            "pot".charAt(0).toUpperCase() + "pot".slice(1);
                                  "P"                     +     "ot";
                            return "Pot";                                                        
      End of the map() method */
    });
  
   // Step 4. Return the output
   return str.join(' '); // ["I'm", "A", "Little", "Tea", "Pot"].join(' ') => "I'm A Little Tea Pot"
}

// Fetch data from website
async function getRecipeData(recipe_url) {
    const recipe_data_query = {
        method: 'GET',
        url: 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/extract',
        params: {
          url: recipe_url,
          forceExtraction: 'true'
        },
        headers: {
          'X-RapidAPI-Key': '00f6565afbmsh69bb7832c73481dp14a245jsn43aebbf3e65d',
          'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com'
        }
      };

    try {
        const recipe_response = await axios.request(recipe_data_query);
        console.log(`getRecipeData: HTTP GET --> ${recipe_response.status} ${recipe_response.status === 200 ? "Done" : "Failed"}`);
        return recipe_response;
    } catch (error) {
        console.error('Error making the HTTP GET request for the recipe:\n', error);
        return;
    }
}
function parseIngredients(response_data) {

    const ingredient_clean_list = [];
    const ingredient_original_list = [];

    for (const ingredient_object of response_data.extendedIngredients) {
        ingredient_clean_list.push(ingredient_object.nameClean);
        ingredient_original_list.push(ingredient_object.original);
    }

    return [ingredient_clean_list, ingredient_original_list];
}
async function analyzeRecipeData(response_data) {

    const analysis_query = {
        method: 'POST',
        url: 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/analyze',
        params: {
          language: 'en',
          includeNutrition: 'true',
          includeTaste: 'false'
        },
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': '00f6565afbmsh69bb7832c73481dp14a245jsn43aebbf3e65d',
          'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com'
        },
        data: {
            "title": response_data.title,
            "servings": response_data.servings,
            "ingredients": parseIngredients(response_data)[1],
            "instructions": response_data.instructions
        }
    };

    try {
        const analyzed_response = await axios.request(analysis_query);
        console.log(`analyzeRecipeData: HTTP POST --> ${analyzed_response.status} ${analyzed_response.status === 200 ? "Done" : "Failed"}`);
        return analyzed_response;
    } catch (error) {
        console.error('Error making the HTTP POST request for the analysis:\n', error);
        return;
    }
}

// Find or create relevant ingredients in Notion
async function searchForIngredient(ingredient_name) {

    const search_query = {
        method: 'POST',
        url: `https://api.notion.com/v1/databases/${process.env.NOTION_INGREDIENT_DATABASE_ID}/query`,
        headers: {
            accept: 'application/json',
            'Notion-Version': '2022-06-28',
            'content-type': 'application/json',
            Authorization: `Bearer ${process.env.NOTION_INTEGRATION_SECRET}`
        },
        data: {
            filter: {
                "property": "Item Name",
                "rich_text": {
                    "equals": ingredient_name
                }
            }
          }
    };

    let search_response = {data: {results: []}}; // housekeeping so that if the HTTP request fails, the for loop won't error out

    // Search for a page, return the ID if found
    try {
        search_response = await axios.request(search_query);
        console.log(`searchForIngredient: HTTP POST --> ${search_response.status} ${search_response.status === 200 ? "Done" : "Failed"}`);
    } catch (error) {
        console.error(`Error searching for ingredient ${ingredient_name}:\n`, error)
    }

    for (const found_page of search_response.data.results) {
        if (found_page.properties["Item Name"].title[0].text.content === ingredient_name) {
            return found_page.id;
        }
    }

    return;
}
async function createNewIngredient(ingredient_name, ingredient_category="General") {

    const categories = [];
    for (const token of ingredient_category.split(';')) {
        categories.push({"name": titleCase( cleanString(token) ), "color": "default"})
    }

    const create_ingredient_query = {
        method: 'POST',
        url: `https://api.notion.com/v1/pages`,
        headers: {
            accept: 'application/json',
            'Notion-Version': '2022-06-28',
            'content-type': 'application/json',
            Authorization: `Bearer ${process.env.NOTION_INTEGRATION_SECRET}`
        },
        data: {
            parent: {
                "database_id":`${process.env.NOTION_INGREDIENT_DATABASE_ID}`,
            },
            properties: {
                "Item Name": {
                    "type": "title",
                    "title": [
                        {
                            "type": "text",
                            "text": {
                                "content": ingredient_name,

                            }
                        }
                    ]
                },
                "Category / Aisle":{
                    "multi_select": categories
                }
            },
            icon: {
                "type": "external",
                "external": {
                    "url": "https://www.notion.so/icons/list_gray.svg"
                }
            }
        }
    }

    // if not found, create a page
    try {
        const create_page_response = await axios.request(create_ingredient_query);
        console.log(`createNewIngredient: HTTP POST --> ${create_page_response.status} ${create_page_response.status === 200 ? "Done" : "Failed"}`);
        return create_page_response.data.id;
    } catch (error) {
        console.error(`Error creating new ingredient ${ingredient_name}:\n`, error)
    }
}
async function getIngredientID(ingredient) {

    // remove non-alphabet characters from the ingredient name
    const ingredient_name = titleCase( cleanString(ingredient.nameClean) );
    let ingredient_category;

    if (ingredient.aisle !== null) {
        ingredient_category = titleCase( cleanString(ingredient.aisle, false) );
    } else {
        ingredient_category = "General"; 
    }
    
    let ingredient_id;

    // search for the ingredient
    ingredient_id = await searchForIngredient(ingredient_name);

    // if it does not exist, create it
    if (ingredient_id === undefined) {
        ingredient_id = await createNewIngredient(ingredient_name, ingredient_category);
    }

    // return the found/created id
    return ingredient_id;

}
async function guessCuisine() {}

// Add recipe data to Notion-compatible object
// Create formatted notion page and push it to notion
async function addNotionPageProperties(notion_page_data, recipe_data, analyzed_data) {

    // Recipe Title
    notion_page_data.properties.Name.title[0].text.content = recipe_data.title;

    // // Recipe Cover
    // notion_page_data.properties.Cover.files[0].external.url = recipe_data.image ? recipe_data.image : "https://i.imgur.com/rMMMi1r.png"

    // Recipe URL
    notion_page_data.properties.URL.url = recipe_data.sourceUrl;

    // Applicable Course(s)
    if (recipe_data.dishTypes.length > 0) {
        for (const element of recipe_data.dishTypes) {
            notion_page_data.properties.Course.multi_select.push({"name": titleCase(cleanString(element)), "color":"default"});
        }    
    } else if (analyzed_data.dishTypes.length > 0) {
        for (const element of analyzed_data.dishTypes) {
            notion_page_data.properties.Course.multi_select.push({"name": titleCase(cleanString(element)), "color":"default"});
        }     
    }

    // Number of Servings
    if (recipe_data.servings !== -1) {
        notion_page_data.properties.Servings.number = recipe_data.servings;
    } else {
        notion_page_data.properties.Servings.number = analyzed_data.servings;
    }

    let calories;
    let protein;
    for (const nutrient of analyzed_data.nutrition.nutrients) {
        if (nutrient.name === "Calories") {
            calories = nutrient.amount;
        }
        if (nutrient.name === "Protein") {
            protein = nutrient.amount;
        }
    }
    
    // Nutrition Info (Calories and Protein)
    if (calories !== null) {
        notion_page_data.properties.Calories.number = calories;
    }
    if (protein !== null) {
        notion_page_data.properties["Protein (g)"].number = protein;
    }

    // Time
    if (recipe_data.preparationMinutes !== -1) {
        notion_page_data.properties["Prep Time (min)"].number = recipe_data.preparationMinutes;
    } else {
        notion_page_data.properties["Prep Time (min)"].number = analyzed_data.preparationMinutes;
    }
    if (recipe_data.cookingMinutes !== -1) {
        notion_page_data.properties["Cooking Time (min)"].number = recipe_data.cookingMinutes;
    } else {
        notion_page_data.properties["Cooking Time (min)"].number = analyzed_data.cookingMinutes;
    }
    if (recipe_data.readyInMinutes !== -1) {
        notion_page_data.properties["Total Time (min)"].number = recipe_data.readyInMinutes;
    } else {
        notion_page_data.properties["Total Time (min)"].number = analyzed_data.readyInMinutes;
    }

    // Applicable Cuisines
    if (recipe_data.cuisines.length > 0) {
        for (const element of recipe_data.cuisines) {
            notion_page_data.properties.Cuisine.multi_select.push({"name": element, "color":"default"});
        }
    } else if (analyzed_data.cuisines.length > 0) {
        for (const element of analyzed_data.cuisines) {
            notion_page_data.properties.Cuisine.multi_select.push({"name": element, "color":"default"});
        }
    }
    // else {
    //     notion_page_data.properties.Cuisine.multi_select.push({
    //         "name": guessCuisine(), 
    //         "color":"default"
    //     });
    // }

    // Tags
    if (recipe_data.vegetarian && analyzed_data.vegetarian) {
        notion_page_data.properties.Tags.multi_select.push({"name":"Vegetarian", "color":"default"});
    }
    if (analyzed_data.vegan) {
        notion_page_data.properties.Tags.multi_select.push({"name":"Vegan", "color":"default"});
    }
    if (analyzed_data.glutenFree) {
        notion_page_data.properties.Tags.multi_select.push({"name":"Gluten Free", "color":"default"});
    }
    if (analyzed_data.veryHealthy) {
        notion_page_data.properties.Tags.multi_select.push({"name":"Healthy", "color":"default"});
    }
    if (analyzed_data.cheap) {
        notion_page_data.properties.Tags.multi_select.push({"name":"Cheap", "color":"default"});
    }
    if (analyzed_data.dairyFree) {
        notion_page_data.properties.Tags.multi_select.push({"name":"Dairy Free", "color":"default"});
    }

    if (calories / protein < 15) {
        notion_page_data.properties.Tags.multi_select.push({"name":"High Protein", "color":"default"});
    }

    // Ingredients
    if (recipe_data.extendedIngredients.length > 0) {
        for (const ingredient of recipe_data.extendedIngredients) {
            notion_page_data.properties.Ingredients.relation.push({"id": await getIngredientID(ingredient)});
        }
    }

    return notion_page_data;
}
function addNotionPageContent(notion_page_data, recipe_data) {
    let page_content = {
        "object": "block",
        "type": "column_list",
        "column_list": {
            "children": [
                {
                    "object": "block",
                    "type": "column",
                    "column": {
                        "children": []
                    }
                },
                {
                    "object": "block",
                    "type": "column",
                    "column": {
                        "children": []
                    }
                }
            ]
        }
    };

    // Add Image of Recipe in first column
    page_content.column_list.children[0].column.children.push(
        {
            "object":"block",
            "type": "image",
            "image": {
                "type": "external",
                "external": {
                    "url": recipe_data.image
                }
            }
        },
    );
    
  
    
    // Add Ingredients Header
    page_content.column_list.children[1].column.children.push(
        {
            "object":"block",
            "type": "heading_3",
            "heading_3": {
                "rich_text": [{
                "type": "text",
                    "text": {
                        "content": "Ingredients"
                    }
                }]
            }
        },
        {
            "object":"block",
            "type": "divider",
            "divider": {}
        },
    );

    // Add ingredients as bulleted list
    for (const ingredient of recipe_data.extendedIngredients) {
        page_content.column_list.children[1].column.children.push(
            {
                "object":"block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{
                        "type": "text",
                        "text": {
                            "content": cleanString( ingredient.original )
                        }
                    }],
                }
            },
        );
    }

    // Add Instructions Heading
    page_content.column_list.children[1].column.children.push(
        {
            "object":"block",
            "type": "heading_3",
            "heading_3": {
                "rich_text": [{
                "type": "text",
                    "text": {
                        "content": "Instructions"
                    }
                }]
            }
        },
        {
            "object":"block",
            "type": "divider",
            "divider": {}
        },
    );

    // Add actual instructions / steps
    for (const instruction of recipe_data.analyzedInstructions) {

        const current_steps = [];

        if (instruction.name === "") {
            for (const step_object of instruction.steps) {
                // Add the steps directly to the notion page as numbered items
                page_content.column_list.children[1].column.children.push(
                    {
                        "object":"block",
                        "type": "numbered_list_item",
                        "numbered_list_item": {
                            "rich_text": [{
                                "type": "text",
                                "text": {
                                    "content": cleanString(step_object.step)
                                }
                            }],
                        }
                    },
                );
            }

        } else { 

            for (const step_object in instruction.steps) {
                // Add the steps as children to the current bullet point
                current_steps.push(
                    {
                        "object":"block",
                        "type": "numbered_list_item",
                        "numbered_list_item": {
                            "rich_text": [{
                                "type": "text",
                                "text": {
                                    "content": cleanString(step_object.step)
                                }
                            }],
                        }
                    },
                );
            }

            // Push the name as the point content with the steps as sub-points
            page_content.column_list.children[1].column.children.push(
                {
                    "object":"block",
                    "type": "numbered_list_item",
                    "numbered_list_item": {
                        "rich_text": [{
                            "type": "text",
                            "text": {
                                "content": cleanString(instruction.name)
                            }
                        }],
                        "children": current_steps
                    }
                },
            );
            
        }

        // Sometimes, the steps are written so that there is only one item in analyzedInstructions
        // However, that one item has multiple steps inside. The current code may not handle this properly
        // Define a function addSubStepsToNotionPageContent to handle this

    }

    notion_page_data.children = [page_content];

    return notion_page_data;

}
async function pushNotionPage(recipe_data, analyzed_data) {

    let notion_page_data = require("./recipe_template.json");
    notion_page_data.parent.database_id = process.env.NOTION_RECIPE_DATABASE_ID;

    notion_page_data = await addNotionPageProperties(notion_page_data, recipe_data, analyzed_data);

    notion_page_data = addNotionPageContent(notion_page_data, recipe_data);

    const notion_push_query = {
        method: 'POST',
        url: 'https://api.notion.com/v1/pages',
        headers: {
          accept: 'application/json',
          'Notion-Version': '2022-06-28',
          'content-type': 'application/json',
          Authorization: `Bearer ${process.env.NOTION_INTEGRATION_SECRET}`
        },
        data: notion_page_data
    };

    try {
        const notion_post_response = await axios.request(notion_push_query);
        console.log(`pushNotionPage: HTTP POST --> ${notion_post_response.status} ${notion_post_response.status === 200 ? "Done" : "Failed"}`);
        return notion_post_response;
    } catch (error) {
        console.error('Error making the HTTP POST request to Notion:\n', error);
        return;
    }

}

function writeResponseDataToJSON(response, filename="response.json") {
    try {
        const jsonData = JSON.stringify(response.data);
        fs.writeFile(filename, jsonData, 'utf-8', (err) => {
            err ? console.error('Error writing JSON file:', err) : {};
        });
    } catch (error) {
        console.error("Error converting response to JSON:", error);
    }
}

/*
Test URLs:
    https://joyfoodsunshine.com/the-most-amazing-chocolate-chip-cookies/
    http://www.melskitchencafe.com/the-best-fudgy-brownies/
    https://www.theideaskitchen.com.au/chicken-teriyaki-poke-bowl/
    https://www.bakeandbacon.com/high-protein-overnight-oats-3-ways/
*/

export async function parse(url) {
    const recipe_response = await getRecipeData(url);
    writeResponseDataToJSON(recipe_response, "./outputs/recipe.json");

    const analysis_response = await analyzeRecipeData(recipe_response.data);
    writeResponseDataToJSON(analysis_response, "./outputs/analysis.json");

    const new_notion_recipe_page = await pushNotionPage(recipe_response.data, analysis_response.data);
    writeResponseDataToJSON(new_notion_recipe_page, "./outputs/notion.json");


    console.log(`\nNew Page URL:\nhttps://www.notion.so/mihirmodak/${new_notion_recipe_page.data.properties.Name.title[0].text.content.split(' ').join("-")}-${new_notion_recipe_page.data.id.split("-").join("")}`);

}

async function main() {
    const url = prompt("Enter the URL to convert: ");
    await parse(url);
}

if (isRunningDirectlyViaCLI) {
    main();
}

