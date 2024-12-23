import { exchangeCurrency } from "@/controllers/tms.app";

export default async function handler(req, res) {
    if(req.method === "GET"){
        try {
            const {currency} = req.query;
            const response = await exchangeCurrency(currency);
            return res.status(200).json({data: response});
        } catch (error) {
            res.status(500).json({error: 'Error fetching currency'});
        }
    }
}