import { Injectable } from '@nestjs/common';
import axios from 'axios';
import https from 'https';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Learning Lab API is running';
  }

  async getQuote(): Promise<{ content: string; author: string }> {
    const response = await axios.get(
      'https://api.quotable.io/quotes/random?tags=education|science|life',
      {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );
    const data = response.data;
    return data[0];
  }
}
