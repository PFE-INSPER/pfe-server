/* eslint-disable quote-props */
/* eslint-disable quotes */
/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable brace-style */
/* eslint-disable indent */
/* eslint-disable no-trailing-spaces */
/* eslint-disable max-len */
/* eslint-disable eqeqeq */

const ChartJSImage = require('chart.js-image');

const { CloudantV1 } = require('@ibm-cloud/cloudant');
// const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-cloud-sdk-core');
// npm install --save @ibm-cloud/cloudant

const cloudant_apikey = "H6S_Fqm9h0joZx3kSBvFmpMrcqJcf0QhxRZoY_xLgof3";
const cloudant_url = "https://f8358e94-16a5-4939-88b8-1ea7f953075f-bluemix.cloudantnosqldb.appdomain.cloud";

const authenticator = new IamAuthenticator({apikey: cloudant_apikey});
const cloudant = new CloudantV1({authenticator: authenticator});
cloudant.setServiceUrl(cloudant_url);

// const nlu_apikey = "xGKxvpO_V7pHw155Wk1Gb7xXE8VE_X64gr9Et6OikubS";
// const nlu_url = "https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/925e2661-65d0-473c-84fb-4588f1254c36";

// const nlu = new NaturalLanguageUnderstandingV1({
//   version: '2021-08-01',
//   authenticator: new IamAuthenticator({
//     apikey: nlu_apikey,
//   }),
//   serviceUrl: nlu_url,
// });

exports.index = (req, res) => {
  res.json({
    messsage: 'Essa rota esta funcionando!',
  });
};


exports.postTest = (req, res) => {
  console.log(req.body);
  
  let progressChart = `https://quickchart.io/chart?w=300&h=200&c={type:%27progressBar%27,data:{datasets:[{backgroundColor:%27red%27,data:[50]}]}}`;
};


let html_colapse = `
<div>
</div> `;


exports.iframe = (req, res) => {
  res.send(html_colapse);
};

exports.postNews = (req, res) => {
  console.log(req.body);
  let action = req.body.action;
  let txt = req.body.text;
  let all_entities = req.body.all_entities;
  let query_entities = '';
  for (let i = 0; i < all_entities.length; i++){
    if (all_entities[i].entity == 'Location'){
      query_entities += `${all_entities[i].value} OR `;
    }
    else if (all_entities[i].entity == 'Pronome'){
      // pass
    }
    else {
      query_entities += `${all_entities[i].value}~ OR `;
    }
  }
  query_entities = query_entities.slice(0, -3); 
  console.log(query_entities);

  // const analyzeParams = {
  //   'url': 'www.cnn.com',
  //   'features': {
  //     'entities': {
  //       'sentiment': true,
  //       'limit': 1
  //     }
  //   }
  // };
  
  // nlu.analyze(analyzeParams)
  //   .then(analysisResults => {
  //     console.log(JSON.stringify(analysisResults, null, 2));
  //   })
  //   .catch(err => {
  //     console.log('error:', err);
  //   });

  if (action == 'sentimento'){
    console.log('roda sentimento');
    cloudant.postSearch({
      db: 'noticias-db',
      ddoc: 'index0',
      index: 'AllData',
      query: query_entities,
      limit: 10,
    }).then(response => {
      let itens = response.result.rows;
   
      let xyValues = [];
        let media = 0;
        for (let i = 0; i < itens.length; i++){
          let enrichments = JSON.parse(itens[i].fields.enrichments);
          let sentimento = enrichments.sentiment.document.score;
          let date = new Date(itens[i].fields.date);
          xyValues.push({x: date, y: sentimento});
          media += sentimento / itens.length;
        }
        if (media > 0) {
          media = 'positivo';
        } else if (media < 0){
          media = 'negativo';
        } else {
          media = 'neutro';
        }
        xyValues.sort((a, b) => a.x.getTime() - b.x.getTime());
        let sent = [];
        let lab = [];
        let last_month = -1;
        let last_year = -1;


        for (let i = 0; i < itens.length; i++) {
          let month = xyValues[i].x.getMonth() + 1; 
          let year = xyValues[i].x.getFullYear();
          if (last_month == month && last_year == year) {
            let temp_sent = (xyValues[i - 1].y + xyValues[i].y) / 2;
            sent.push(temp_sent);
          }
          else {
            sent.push(xyValues[i].y);
            lab.push(`${month}-${year}`);
          }
          last_month = month;
          last_year = year;
        }
        const sentiment_chart = ChartJSImage().chart({
          "type": "line",
          "data": {
            "labels": lab,
            "datasets": [
              {
                "label": "sentimento",
                "borderColor": "rgb(255,+99,+132)",
                "backgroundColor": "rgba(255,+99,+132,+.5)",
                "data": sent
              },
            ]
          },
          "options": {
            "title": {
              "display": true,
              "text": "Sentimento X Tempo"
            },
            "scales": {
              "xAxes": [
                {
                  "scaleLabel": {
                    "display": true,
                    "labelString": "Tempo"
                  }
                }
              ],
              "yAxes": [
                {
                  "stacked": true,
                  "scaleLabel": {
                    "display": true,
                    "labelString": "Sentimento"
                  }
                }
              ]
            }
          }
        })
        .backgroundColor('white')
        .width(500) // 500px
        .height(300); // 300px
        let img = sentiment_chart.toURL();
        res.json({
          status: 'ok',
          sentimento: media,
          sentimentoImg: img,
        });
      })
      .catch(err => {
          console.log('error:', err);
        });

  }
  else if (action === 'noticia') {
    cloudant.postSearch({
      db: 'noticias-db',
      ddoc: 'index0',
      index: 'AllData',
      query: query_entities,
      limit: 3,
    }).then(response => {
      let itens = response.result.rows;

      let resObj = {status: 'ok'};
      for (let i = 0; i < itens.length; i++){
        let title = itens[i].fields.title;
        let text = itens[i].fields.text;
        let text_mini = `${text.substring(0, 400)} ...`;
        let enrichments = JSON.parse(itens[i].fields.enrichments);
        let classification = JSON.parse(itens[i].fields.classification);
        let date = itens[i].fields.date;
        let category = itens[i].fields.category;
        let link = itens[i].fields.link;
        let assunto = enrichments.categories[0].label;
        
        let color = 'red';
        if (classification.class_name == 'Direita') color = 'blue';
        let conf = (classification.confidence * 100).toFixed(2);
        let progressBar_url = `https://quickchart.io/chart?w=100&h=50&c={type:%27progressBar%27,data:{datasets:[{backgroundColor:%27${color}%27,data:[${conf}]}]}}`;

        let htmlo = `
          <div style="background-color:rgb(211,211,211);border-radius: 15px;padding-left: 15px;padding-right: 15px;padding-bottom: 15px;">
          
            <h3>${title}</h3>

            <p>${text_mini}</p>
            <p>Categorias: ${assunto}</p>
            <p>Classificação espectro politico: ${classification.class_name}</p>
            <img src=${progressBar_url}>

            <a href="${link}">Link noticia completa</a>
          </div>
          `;                  
                
        resObj[`item_${i}`] = {
          title,
          text_mini,
          text,
          enrichments,
          classification,
          date,
          category,
          link,
          assunto,
          progressBar_url,
          htmlo
        };
      }
      res.json(resObj);
    });
    
  }
  else if (action === 'resumo') {
    console.log("resumo");
    cloudant.postSearch({
      db: 'noticias-db',
      ddoc: 'index0',
      index: 'AllData',
      query: query_entities,
      limit: 3,
    }).then(response => {
      let itens = response.result.rows;

      let resObj = {status: 'ok'};
      for (let i = 0; i < itens.length; i++){
        let title = itens[i].fields.title;
        let text = itens[i].fields.text;
        let text_mini = `${text.substring(0, 400)} ...`;
        let enrichments = JSON.parse(itens[i].fields.enrichments);
        let classification = JSON.parse(itens[i].fields.classification);
        let date = itens[i].fields.date;
        let category = itens[i].fields.category;
        let link = itens[i].fields.link;
        let assunto = enrichments.categories[0].label;
        // console.log(classification.confidence);
        
        let color = 'red';
        if (classification.class_name == 'Direita') color = 'blue';

        let progressBar_url = `https://quickchart.io/chart?w=300&h=200&c={type:%27progressBar%27,data:{datasets:[{backgroundColor:%27${color}%27,data:[${classification.confidence}]}]}}`;

        resObj[`item_${i}`] = {
          title,
          text_mini,
          text,
          enrichments,
          classification,
          date,
          category,
          link,
          assunto,
          progressBar_url
        };
      }
      res.json(resObj);
    });
  }
  else if (action == 'entidades'){
    console.log('roda wordcloud');
    cloudant.postSearch({
      db: 'noticias-db',
      ddoc: 'index0',
      index: 'AllData',
      query: query_entities,
      limit: 10,
    }).then(response => {
      
      let itens = response.result.rows;
      
      let xyValues = [];
      for (let i = 0; i < itens.length; i++){
        let enrichments = JSON.parse(itens[i].fields.enrichments);
        
        for (let e = 0; e < enrichments.entities.length; e++){
          let entity = enrichments.entities[e].text;
          let count = enrichments.entities[e].count;
          if (count > 0) {
            xyValues.push({x: entity, y: count});
          }
        }
      }
      
      let wordcloud_url = `https://quickchart.io/wordcloud?text=`;
      for (let i = 0; i < xyValues.length; i++){

        wordcloud_url += `${xyValues[i].x.replace(/[` ~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')}%20`.repeat(xyValues[i].y);
      }
      res.json({
        status: 'ok',
        wordcloud_url: wordcloud_url,
      });
    })
    .catch(err => {
      console.log('error:', err);
    });
  }
  // else if (action == 'polaridade'){
  //   console.log('roda polaridade');
  //   cloudant.postSearch({
  //     db: 'noticias-db',
  //     ddoc: 'index0',
  //     index: 'AllData',
  //     query: query_entities,
  //     limit: 1,
  //   }).then(response => {
      
  //     let itens = response.result.rows;
  //     let wordcloud_url = `https://quickchart.io/chart?w=300&h=200&c={type:%27progressBar%27,data:{datasets:[{backgroundColor:%27red%27,data:[50]}]}}`;
      
  //     res.json({
  //       status: 'ok',
  //       wordcloud_url: wordcloud_url,
  //     });
  //   })
  //   .catch(err => {
  //     console.log('error:', err);
  //   });
  // }

  else {
    res.json({
      status: 'action not found',
    });
  }
};
