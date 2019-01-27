import { JsonController, Get, Param, QueryParams, Post, BodyParam, Body } from "routing-controllers";
import {framer, mfcc} from 'sound-parameters-extractor';

import * as kmeans from 'ml-kmeans';
import * as fft from 'fft-js';
import * as fs from 'fs';
import * as _ from 'lodash';

const config = {
  fftSize: 32,
  bankCount: 24,
  lowFrequency: 133.3333,
  highFrequency: 8000, // samplerate/2 here
  sampleRate: 16000
};

const K = 8;
const MFCC_LENGTH = 13;
const ROOT = './training_data';

@JsonController('/trainings')
export class TrainingController {
    constructor() {}

    @Post("/extract")
    async extract(@Body() data: any) {
        const userFeatures = this.train(data.users);
        const keywordFeatures = this.train(data.keywords);

        const userPath = ROOT + '/users';
        const keywordPath = ROOT + '/keywords';

        if (!fs.existsSync(userPath)) {
            fs.mkdirSync(userPath);
        }

        if (!fs.existsSync(keywordPath)) {
            fs.mkdirSync(keywordPath);
        }

        fs.writeFileSync(userPath + '/' + data.name + '.json', JSON.stringify(userFeatures.centroids));
        fs.writeFileSync(keywordPath + '/' + data.name + '_' + data.keyword + '.json', JSON.stringify(keywordFeatures.centroids));

        return {status: 'ok'};
    }

    private train(data): any {
        let mfccs = [];

        for (let i=0; i<data.length; i++) {
            const signal = data[i];
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
       
        return kmeans(mfccs, K, { initialization: centers });
    }
}