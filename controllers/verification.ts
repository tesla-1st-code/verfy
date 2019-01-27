import { JsonController, Get, Param, QueryParams, Post, BodyParam, Body } from "routing-controllers";
import {framer, mfcc} from 'sound-parameters-extractor';

import * as kmeans from 'ml-kmeans';
import * as fft from 'fft-js';
import * as fs from 'fs';

const config = {
  fftSize: 32,
  bankCount: 24,
  lowFrequency: 133.3333,
  highFrequency: 8000, // samplerate/2 here
  sampleRate: 16000
};

const K = 8;
const MFCC_LENGTH = 13;
const USER_ROOT = './training_data/users';
const KEYWORD_ROOT = './training_data/keywords';

@JsonController('/verifications')
export class VerificationController {
    constructor() {}

    @Post('/verify')
    async verify(@Body() data: any) {
       let result = this.match(data.signal);

       return result;
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

    private match(data) {
        const windowSize = config.fftSize * 2;
        const overlap = '50%';
        const mfccSize = MFCC_LENGTH;
        const framedSignal = framer(data, windowSize, overlap);
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
    
        let usersPath = fs.readdirSync(USER_ROOT);
        let keywordsPath = fs.readdirSync(KEYWORD_ROOT);

        let selectedUser = null;
        let selectedKeyword = null;
        let minUser = Number.MAX_VALUE;
        let minKeyword = Number.MAX_VALUE;
        
        for (let i=0; i<usersPath.length; i++) {
            let path = usersPath[i];
            let trainingCentroids = JSON.parse(fs.readFileSync(USER_ROOT + '/' + path).toString());
            let min = Number.MAX_VALUE;

            for (let j=0; j<K; j++) {
                for (let k=0; k<K; k++) {
                    let v1 = centroids[j].centroid;
                    let v2 = trainingCentroids[k].centroid;
                    let dist = this.eucDistance(v1, v2);

                    if (dist < min) {
                        min = dist;
                    }
                }
            }

            if (min < minUser) {
                minUser = min;
                selectedUser = path.split('.')[0];
            }
        }

        for (let i=0; i<keywordsPath.length; i++) {
            let path = keywordsPath[i];
            let trainingCentroids = JSON.parse(fs.readFileSync(KEYWORD_ROOT + '/' + path).toString());
            let min = Number.MAX_VALUE;
       
            for (let j=0; j<K; j++) {
                for (let k=0; k<K; k++) {
                    let v1 = centroids[j].centroid;
                    let v2 = trainingCentroids[k].centroid;
                    let dist = this.eucDistance(v1, v2);

                    if (dist < min) {
                        min = dist;
                    }
                }
            }

            if (min < minKeyword) {
                minKeyword = min;
                selectedKeyword = path.split('.')[0];
            }
        }

        let userKeyword = selectedKeyword.split('_')[0];
        
        if (selectedUser.toLowerCase() === userKeyword.toLowerCase() && minUser <= 3) {
            return {user: selectedUser, userDistance: minUser, keywordDistance: minKeyword };
        }
        else {
            return { user: null };
        }
    }
}