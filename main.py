# To add a new cell, type '# %%'
# To add a new markdown cell, type '# %% [markdown]'
# %%
from dotenv import dotenv_values
env = dotenv_values(".env")

import requests
import json
import argparse


# %%
parser = argparse.ArgumentParser(description='URL')
parser.add_argument('--url', '-u', help='The URL for the recipe', required=True)


# %%
api_url = "https://mycookbook-io1.p.rapidapi.com/recipes/rapidapi"
# recipe = "https://shewearsmanyhats.com/mushroom-florentine-pasta-recipe/"
args =  parser.parse_args()
recipe = args.url

headers = {
    'content-type': "text/plain",
    'x-rapidapi-host': "mycookbook-io1.p.rapidapi.com",
    'x-rapidapi-key': env['MYCOOKBOOK_KEY']
    }


# %%
response = requests.request("POST", api_url, data=recipe, headers=headers)


# %%
with open("response.json", 'w+') as f:
    json.dump(response.json(), f)


# %%
responseData = response.json()[0]
responseData.keys()


# %%
notion_url = f"https://api.notion.com/v1/pages"

notion_tokens = {'Authorization': env['NOTION_KEY']}


# %%
responseData['instructions'][0]['steps']


# %%
pageData = [

        {
            "type": "heading_3",
            "heading_3": {
                "text": [{
                    "type": "text",
                        "text": {
                            "content": "Description"
                        }
                }]
            }
        },

        {
            "type": "paragraph",
            "paragraph": {
                "text": [{
                    "type": "text",
                    "text": {
                        "content": responseData['description'],
                    }
                }]
            }
        },

        {
            "type": "heading_3",
            "heading_3": {
                "text": [{
                "type": "text",
                    "text": {
                        "content": "Ingredients"
                    }
                }]
            }
        }
]

for item in responseData['ingredients']:
    pageData.append(
        {
            "type": "bulleted_list_item",
            "bulleted_list_item": {
                "text": [{
                    "type": "text",
                    "text": {
                        "content": item
                    }
                }],
            }
        },
    )



pageData.append(
    {
        "type": "heading_3",
        "heading_3": {
            "text": [{
            "type": "text",
                "text": {
                    "content": "Instructions"
                }
            }]
        }
    },
)

for item in responseData['instructions'][0]['steps']:
    pageData.append(
        {
            "type": "numbered_list_item",
            "numbered_list_item": {
                "text": [{
                    "type": "text",
                    "text": {
                        "content": item
                    }
                }],
            }
        }
    )

pageData.append(
        {
            "type": "heading_3",
            "heading_3": {
                "text": [{
                "type": "text",
                    "text": {
                        "content": "Notes"
                    }
                }]
            }
        }
    )


# %%
data = {
    "parent":{"database_id":env['NOTION_DATABASE_ID']},

    "properties": {
        "Name" : {
            "title": [
                {
                    "text": {
                        "content": responseData['name'] 
                    }
                }
            ]
        },

        "URL":{
            "url":responseData['url']
        },

        "Prep Time (min)": {
            "number":int(responseData['prep-time'][2:-1]) if responseData['prep-time'][-1] == 'M' else int(responseData['prep-time'][2:-1])*60 if responseData['prep-time'][-1] == 'H' else -1
        },

        "Total Time (min)": {
            "number":int(responseData['total-time'][2:-1]) if responseData['total-time'][-1] == 'M' else int(responseData['total-time'][2:-1])*60 if responseData['total-time'][-1] == 'H' else -1
        },

    },

    "children":pageData

}

r = requests.post(notion_url, json=data, headers=notion_tokens)
print(f"{responseData['name']} --> {r.status_code}")
if r.status_code != 200:
    errorData = json.loads(r.text)
    print(f"{errorData['code']} : {errorData['message']}")


# %%
responseData


# %%



