# Notion Recipe Loader
This Notion Recipe Parser tool lets you load recipe content from any website recipe into a Notion page.

## Dependencies:

- A MyCookBook.io API Key ([link](https://rapidapi.com/mycookbook/api/mycookbook-io1))

- A Notion API Key ([link](https://developers.notion.com/))

- The database ID of the end point Notion page (the final home of the recipes)

- Python 3 and some of its packages:

    - `json`
    - `dotenv`
    - `requests`
    - `argparse`

## Before you run `main.py`

This program tries to protect all involved API keys using the `dotenv` library. The API keys, as well as any other sensitive information in a separate file saved as `.env` in the working directory. You will need to construct this `.env` file for your own API keys with the following keywords.

`MYCOOKBOOK_KEY` &rarr; MyCookBook.io API Key

`NOTION_KEY` &rarr; Notion API Key 

`NOTION_DATABASE_ID` &rarr; The ID of the Notion database where all your recipes will be stored

## To Save a Recipe

To save a recipe into a pre-designated Notion database, run:
```
python3 main.py --url <url>
```

OR

```
python3 main.py -u <url>
```