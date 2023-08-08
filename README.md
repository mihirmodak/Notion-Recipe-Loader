# Notion Recipe Loader

This Notion Recipe Parser tool lets you load recipe content from any website recipe into a Notion page in a specific database.

## Dependencies

| Name | Source |
| ---- | ---- |
| Spoonacular Recipe-Food-Nutrition API | [https://rapidapi.com/spoonacular/api/recipe-food-nutrition/](https://rapidapi.com/spoonacular/api/recipe-food-nutrition/) |
|Notion & the Notion API | [https://developers.notion.com/](https://developers.notion.com/) |
| NodeJS | [https://nodejs.org/en/download](https://nodejs.org/en/download) |
| NodeJS: Axios | `npm install axios` |
| NodeJS: dotenv | `npm install dotenv` |
| NodeJS: prompt-sync | `npm install prompt-sync` |

## Before you run `main.py`

This program tries to protect all involved API keys using the `dotenv` library. The API keys, as well as any other sensitive information in a separate file saved as `.env` in the working directory. You will need to construct this `.env` file for your own API keys with the following keywords.

`MYCOOKBOOK_KEY` &rarr; MyCookBook.io API Key

`NOTION_KEY` &rarr; Notion API Key

`NOTION_DATABASE_ID` &rarr; The ID of the Notion database where all your recipes will be stored

## To Save a Recipe

To save a recipe into a pre-designated Notion database, run:

```cmd
python3 main.py --url <url>
```

OR

```cmd
python3 main.py -u <url>
```
