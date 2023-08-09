import serverless from "serverless-http";
import axios, {
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse,
  Method,
} from "axios";
import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import qs from "qs";
import FormData, { AppendOptions } from "form-data";
import { BlueboxRule, encodeWithRules } from "../bluebox";
import rules from "../../config/replacementRules.json";

if (!process.env.X_ORIGIN_VERIFY || !process.env.PROXY_TARGET) {
  console.error("Required environment variables are not set.");
  process.exit(1);
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(upload.any());

function removeHeaders(headers: Record<string, any>, toRemove: string[]): void {
  toRemove.forEach((header) => delete headers[header]);
}

app.all("*", async (req: Request, res: Response) => {
  // const verify = req.header("x-origin-verify");
  // if (verify !== process.env.X_ORIGIN_VERIFY) {
  //   console.warn("Origin verification failed");
  //   return res.status(403).send("Invalid X-Origin-Verify header");
  // }

  const encode = encodeWithRules({ rules: rules as BlueboxRule[] });
  removeHeaders(req.headers, ["host", "content-length"]);

  const maskedBody = await encode(req.body);
  const maskedHeaders = await encode(req.headers);
  const maskedQuery = await encode(req.query);

  const axiosBaseConfig: AxiosRequestConfig = {
    method: req.method as Method,
    headers: maskedHeaders as AxiosRequestHeaders,
    params: maskedQuery,
    url: `${process.env.PROXY_TARGET}${req.path}`,
  };

  let axiosConfigRequest: AxiosRequestConfig;

  if (
    req.files &&
    req.header("content-type")?.includes("multipart/form-data")
  ) {
    const formData = new FormData();
    for (let file of req.files as Express.Multer.File[]) {
      const {
        fieldname,
        buffer: value,
        originalname: filename,
        mimetype: contentType,
      } = file;
      const options: AppendOptions = { filename, contentType };
      formData.append(fieldname, value, options);
    }
    for (let param of Object.keys(req.body)) {
      formData.append(param, req.body[param]);
    }

    axiosConfigRequest = {
      ...axiosBaseConfig,
      headers: { ...maskedHeaders, ...formData.getHeaders() },
      data: formData,
    };
  } else if (
    req.header("content-type")?.includes("application/x-www-form-urlencoded")
  ) {
    axiosConfigRequest = {
      ...axiosBaseConfig,
      data: qs.stringify(req.body),
    };
  } else {
    axiosConfigRequest = {
      ...axiosBaseConfig,
      data: maskedBody,
    };
  }

  let response: AxiosResponse;
  try {
    response = await axios({ ...axiosConfigRequest, maxRedirects: 0 });
  } catch (ex: any) {
    console.warn({ message: ex.message });
    if (!ex.response) {
      console.error({ message: ex.message, stack: ex.stack });
      return res.status(500).send("Unknown application error occurred");
    }
    response = ex.response;
  }

  return res.status(response.status).set(response.headers).send(response.data);
});

export const blueboxInboundApp = app;

export const handler = serverless(app, {
  binary: ["image/*"],
  request: function (_req: Request, _event: any, context: any) {
    context.callbackWaitsForEmptyEventLoop = false;
  },
});
