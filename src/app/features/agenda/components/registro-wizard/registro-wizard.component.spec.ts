import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroWizardComponent } from './registro-wizard.component';
import { AgendaService } from '../../../../core/services/agenda.service';
import { signal } from '@angular/core';
import { RegistroStatus, RegistroPrioridad, RegistroTipoBase } from '../../../../models/registro.model';
import { AgendaConfig } from '../../../../models/agenda.model';

describe('RegistroWizardComponent', () => {
    let component: RegistroWizardComponent;
    let fixture: ComponentFixture<RegistroWizardComponent>;
    let mockAgendaService: any;

    // Configuración Mock del Servicio
    const mockAreas = [
        { id: 'area_1', name: 'Trabajo', isActive: true },
        { id: 'area_2', name: 'Personal', isActive: true }
    ];
    const mockTipos = [
        { id: 'tipo_1', name: 'Reunión', baseType: RegistroTipoBase.EVENTO },
        { id: 'tipo_2', name: 'Tarea', baseType: RegistroTipoBase.TAREA }
    ];
    const mockContextos = [
        { id: 'ctx_1', areaId: 'area_1', name: 'Oficina' },
        { id: 'ctx_2', areaId: 'area_2', name: 'Casa' }
    ];

    beforeEach(async () => {
        mockAgendaService = {
            activeAreas: signal(mockAreas),
            tipos: signal(mockTipos),
            contextos: signal(mockContextos),
            addRegistro: jasmine.createSpy('addRegistro')
        };

        await TestBed.configureTestingModule({
            imports: [RegistroWizardComponent],
            providers: [
                { provide: AgendaService, useValue: mockAgendaService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RegistroWizardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with step 1 and default values', () => {
        expect(component.currentStep()).toBe(1);
        expect(component.tempRegistro.status).toBe(RegistroStatus.BORRADOR);
        expect(component.tempRegistro.priority).toBe(RegistroPrioridad.SOFT);
    });

    it('should validate step 1 requirements (Name is mandatory)', () => {
        // Inicialmente el nombre está vacío
        component.tempRegistro.name = '';
        expect(component.canProceed()).toBeFalse();

        // Al asignar nombre, debe permitir avanzar
        component.tempRegistro.name = 'Test Registro';
        expect(component.canProceed()).toBeTrue();
    });

    it('should filter contexts based on selected area', () => {
        // Seleccionamos Área 1 (Trabajo)
        component.tempRegistro.areaId = 'area_1';
        component.onAreaChange(); // Resetea contexto
        fixture.detectChanges();

        const ctxTrabajo = component.availableContextos();
        expect(ctxTrabajo.length).toBe(1);
        expect(ctxTrabajo[0].name).toBe('Oficina');

        // Seleccionamos Área 2 (Personal)
        component.tempRegistro.areaId = 'area_2';
        fixture.detectChanges();

        const ctxPersonal = component.availableContextos();
        expect(ctxPersonal.length).toBe(1);
        expect(ctxPersonal[0].name).toBe('Casa');
    });

    it('should add and remove checklist tasks', () => {
        // Inicialmente sin checklists
        expect(component.tempRegistro.checklist).toEqual([]);

        // Agregar Tarea
        component.addTarea();
        expect(component.tempRegistro.checklist?.length).toBe(1);
        expect(component.tempRegistro.checklist![0].completed).toBeFalse();

        // Eliminar Tarea
        component.removeTarea(0);
        expect(component.tempRegistro.checklist?.length).toBe(0);
    });

    it('should navigate through steps', () => {
        component.tempRegistro.name = 'Paso a Paso';

        // Advance to step 2
        component.nextStep();
        expect(component.currentStep()).toBe(2);

        // Advance to step 3
        component.nextStep();
        expect(component.currentStep()).toBe(3);

        // Go back to step 2
        component.prevStep();
        expect(component.currentStep()).toBe(2);
    });

    it('should call saveRegistro on final step', () => {
        // Simulamos estar en el último paso (5)
        component.currentStep.set(5);
        component.tempRegistro.name = 'Registro Final';
        component.tempRegistro.areaId = 'area_1';

        component.saveRegistro();

        expect(mockAgendaService.addRegistro).toHaveBeenCalled();
        const savedArg = mockAgendaService.addRegistro.calls.mostRecent().args[0];
        expect(savedArg.name).toBe('Registro Final');
        expect(savedArg.createdAt).toBeInstanceOf(Date);
    });
});
