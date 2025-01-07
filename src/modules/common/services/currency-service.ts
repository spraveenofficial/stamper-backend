import axios from 'axios';

const CURRENCY_API_URL = 'https://v6.exchangerate-api.com/v6/4e1c85cc8e5329c689f6de62/latest/';

export const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    try {
        const response = await axios.get(`${CURRENCY_API_URL}${fromCurrency}`);
        const rates = response.data.conversion_rates;

        if (!rates[toCurrency]) {
            throw new Error(`Unsupported currency: ${toCurrency}`);
        }

        return Math.round((amount * rates[toCurrency]) * 100) / 100;
    } catch (error: any) {
        console.error('Currency conversion error:', error.message);
        throw new Error('Currency conversion failed.');
    }
};
