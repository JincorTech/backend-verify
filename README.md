# Jincor Verification Service
![Jincor logo](https://raw.githubusercontent.com/JincorTech/backend-verify/master/Logo.png)

# Jincor VERIFY Service

Jincor Verification is a service for verify users email, phone, and etc.
The main responsibilities are:
1. Interact with a service provider
1. Validation of a received code

Take a look at our [Wiki](../../wiki) for more details.

API Endpoints Summary

JWT_TOKEN should be passed for every API call in the HTTP headers,
that was received from auth service.

1. `/methods/{METHOD}/actions/initiate [POST]`
1. `/methods/{METHOD}/verifiers/{VERIFICATION_ID}/actions/validate [POST]`
1. `/methods/{METHOD}/verifiers/{VERIFICATION_ID} [DELETE]`

#How to start development and run tests?

1. Clone this repo.
1. Run `docker-compose build --no-cache`.
1. Run `docker-compose up -d`.
1. To install dependencies run: `docker-compose exec verify npm i`.
1. To run tests run: `docker-compose exec verify npm test`.
1. To build production image run `docker-compose -f docker-compose.prod.yml build --no-cache`.