export interface NicheController {
  create(req: any, res: any): Promise<void>;
  list(req: any, res: any): Promise<void>;
  get(req: any, res: any): Promise<void>;
}

export interface ArticleController {
  list(req: any, res: any): Promise<void>;
  get(req: any, res: any): Promise<void>;
  create(req: any, res: any): Promise<void>;
}

export interface GenerationController {
  generate(req: any, res: any): Promise<void>;
  status(req: any, res: any): Promise<void>;
}
