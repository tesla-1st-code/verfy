import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

declare var MediaRecorder;

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.scss']
})
export class TrainingComponent implements OnInit {
  mediaRecorder: any;
  isRecording: boolean;
  audioChunks: any[];
  users: any[];
  keywords: any[];
  state: string;
  name: string;
  keyword: string;

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.audioChunks = [];
    this.users = [];
    this.keywords = [];
    this.isRecording = false;
    this.initMedia();
  }

  initMedia(): void {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.addEventListener("dataavailable", event => {
        this.audioChunks.push(event.data);
      });

      this.mediaRecorder.addEventListener("stop", async () => {
        const audioBlob = new Blob(this.audioChunks);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.play();

        try {
          const arr = await new Response(audioBlob).arrayBuffer();
          const int16Array = new Int8Array(arr);
          
          let data = [];
  
          int16Array.forEach(val => {
            data.push(val);  
          });

          if (this.state === 'user') {
            this.users.push(
              {
                audioUrl: audioUrl,
                name: 'user_training_' + (this.users.length + 1),
                length: arr.byteLength,
                data: data
              }
            );
          }
          else {
            this.keywords.push(
              {
                audioUrl: audioUrl,
                name: 'keyword_training_' + (this.keywords.length + 1),
                length: arr.byteLength,
                data: data
              }
            );
          }
        }
        catch(error) {
          console.log(error);
        }
        this.audioChunks = [];
      });
    });
  }

  start(state): void {
    this.state = state;
    this.isRecording = true;
    this.mediaRecorder.start();
  }

  stop(): void {
    this.isRecording = false;
    this.mediaRecorder.stop();
  }

  playback(url): void {
    const audio = new Audio(url);
    audio.play();
  }

  delete(state, index): void {
    if (state === 'user')
      this.users.splice(index, 1);
    else
      this.keywords.splice(index, 1);
  }

  async save() {
    let data = {
      name: this.name,
      keyword: this.keyword,
      users: this.users.map(e => e.data),
      keywords: this.keywords.map(e => e.data)
    };

    if (this.users.length < 10 || this.keywords.length < 10 || !this.name || !this.keyword) {
      return;
    }

    try {
      let response = await this.dataService.save(data, 'trainings', 'extract').toPromise();
      this.users = [];
      this.keywords = [];
      this.name = null;
      this.keyword = null;
      this.state = null;
    }
    catch(error) {
      console.log(error);
    }
  }
}
