import { getAnalysisData } from './src/backend/db/operations.js';

async function test() {
    try {
        console.log('Testing getAnalysisData...');
        const data = await getAnalysisData(16, 2026, 2);
        console.log('Success! Data retrieved:', !!data);
        console.log('Income:', data.income);
        console.log('Total Allocations:', data.allocations.length);
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

test();
