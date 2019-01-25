import { JsonController, Get, Param, QueryParams, Post, BodyParam, Body } from "routing-controllers";
import {framer, mfcc} from 'sound-parameters-extractor';

import * as kmeans from 'ml-kmeans';
import * as fft from 'fft-js';
import * as fs from 'fs';

const config = {
  fftSize: 32,
  bankCount: 24,
  lowFrequency: 1,
  highFrequency: 8000, // samplerate/2 here
  sampleRate: 16000
};

const K = 8;
const MFCC_LENGTH = 13;
const ROOT = './training_data';

@JsonController('/trainings')
export class TrainingController {
    constructor() {}

    @Get('/test')
    async test() {
        return {message: 'hello'};
    }

    @Post("/extract")
    async extract(@Body() data: any) {
        let mfccs = [];

        for (let i=0; i<data.audio.length; i++) {
            const signal = data.audio[i];
            const windowSize = config.fftSize * 2;
            const overlap = '50%';
            const mfccSize = MFCC_LENGTH;
            const framedSignal = framer(signal, windowSize, overlap);
            const mfccMatrix = mfcc.construct(config, mfccSize);
            const mfccSignal = framedSignal.map(window => {
                const phasors = fft.fft(window);
                return mfccMatrix(fft.util.fftMag(phasors));
            });
            
            mfccs = mfccs.concat(mfccSignal);
        }
        
        let centers = [];

        for (let i=0; i<K; i++) {
            let center = [];

            for (let j=0; j<MFCC_LENGTH; j++) {
                center.push(Math.random() * 100);
            }

            centers.push(center);
        }
       
        let ans = kmeans(mfccs, 8, { initialization: centers });

        const path = ROOT + '/' + data.name;

        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }

        fs.writeFileSync(path + '/' + data.keyword + '.json', JSON.stringify(ans.centroids));

        return {status: 'ok'};
    }
}