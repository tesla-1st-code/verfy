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

@JsonController('/verifications')
export class VerificationController {
    constructor() {}

    @Post('/verify')
    async verify(@Body() data: any) {
        const windowSize = config.fftSize * 2;
        const overlap = '50%';
        const mfccSize = MFCC_LENGTH;
        const framedSignal = framer(data.signal, windowSize, overlap);
        const mfccMatrix = mfcc.construct(config, mfccSize);
        const mfccSignal = framedSignal.map(window => {
            const phasors = fft.fft(window);
            return mfccMatrix(fft.util.fftMag(phasors));
        });

        let centers = [];

        for (let i=0; i<K; i++) {
            let center = [];

            for (let j=0; j<MFCC_LENGTH; j++) {
                center.push(Math.random() * 100);
            }

            centers.push(center);
        }
        
        let ans = kmeans(mfccSignal, 8, { initialization: centers });
        let centroids = ans.centroids;

        let paths = fs.readdirSync(ROOT);
        let selectedPath = null;
        let min = Number.MAX_VALUE;

        for (let i=0; i<paths.length; i++) {
            let path = paths[i];
            let pathDir = fs.readdirSync(ROOT + '/' + path);
            let trainingCentroids = JSON.parse(fs.readFileSync(ROOT + '/' + path + '/' + pathDir).toString());
           
            for (let j=0; j<K; j++) {
                let v1 = centroids[j].centroid;
                let v2 = trainingCentroids[j].centroid;
                let distance = this.eucDistance(v1, v2);

                if (distance < min) {
                    distance = min;
                    selectedPath = path;
                }
            }
        }
    }

    private eucDistance(v1, v2) {
        if (v1.length !== v2.length) {
            return null;
        }  

        let distance = 0;

        for (let i=0; i<v1.length; i++) {
            distance += Math.pow(v1[i] - v2[i], 2);
        }

        return Math.sqrt(distance);
    }
}