# Aufbau

`{ 'type': [String], 'arguments':  [Object] }`

# Anfragen (Client -> Server)

## Login (Client -> Server)

    {
      'type': 'login',
      'arguments': {
        'user': [String],
        'password': [String]
      }
    }

    {
      'type': 'login',
      'arguments':  { 'sid': [String] }
    }


## Account Befehle

    {
      'type': 'account',
      'arguments': {
        'sid': [String],
        'password': [String],
        'update': {
          'key': [String],
          ...
        }
      }
    }

### Passwort neu setzen

    {
      ...,
      'update': {
        'key': 'password',
        'value': $(new_password)
      }
    }

### Email setzen

    {
      ...,
      'update': {
        'key': 'email',
        'value': $(new_email)
      }
    }

### Account löschen

    {
      ...,
      'update': {
        'key': 'delete'
      }
    }


## Bot Befehl

    {
      'type': 'bot',
      'arguments':  {
        'sid': [String],
        'identifier': [String],
        'execute': {
          'command': [String],
          'argument': [String]
        }
      }
    }


## Bot Verwaltung

### Bot Anlegen

    {
      'type': 'bot_management',
      'arguments': {
        'sid': [String],
        'type': 'create',
        'username': [String],
        'password': [String],
        'package': [String],
        'server': [String],
        'proxies': [String]
      }
    }

### Bot löschen

    {
      'type': 'bot_management',
      'arguments': {
        'sid': [String],
        'type': 'delete',
        'identifier': [String]
      }
    }



# Update (Server -> Client)

## Packages

    {
      'type': 'packages',
      'arguments':  [Object]
    }

Sendet Packages $(packages)


## Session

    {
      'type': 'session',
      'arguments': {
        'sid': [String],
        'expire': [Number]
      }
    }


## Bots Update

    {
      'type': 'bots',
      'arguments': {
        [String]: [Object],
        ...
      }
    }

Sendet Map { $(identifier): $(configuration), ... }


## Update

    {
      'type': 'update',
      'arguments': {
        'identifier': [String],
        'key': [String],
        'value': [String]
      }
    }

**Beispiel:**

    {
      'identifier': $(identifier),
      'key': $(modul)_$(config_key),
      'value': $(new_value)
    }


## Event

    {
      'type': 'event',
      'arguments': {
        'identifier': [String],
        'key': [String],
        'value': [String]
      }
    }


**Beispiel**

    {
      'identifier': $(identifier),
      'key': $(event_name),
      'value': $(event_value)
    }

## Account/Bot Antwort

    {
      'type': 'account',
      'arguments': {
        'key': [String],
        'success': [Boolean] or [String]
      }
    }

**Beispiel**

    {
      'type': 'account',
      'arguments': {
        'key': "login",
        'success': false
      }
    }

**Beispiel**

    {
      'type': 'account',
      'arguments': {
        'key': "create_bot",
        'success': "error message"
      }
    }
