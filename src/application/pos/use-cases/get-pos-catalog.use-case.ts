import { PosRepository } from '../../../domain/pos/contracts/pos.repository';

export class GetPosCatalogUseCase {
  constructor(private readonly repository: PosRepository) {}
  public execute(branchId: string) { return this.repository.getCatalog(branchId); }
}
